import { calculate_goal } from "./calculate.js";
import { Orders, ObjectID } from "../middlewares/mongo.js";
import { send_notification } from "../middlewares/notification.js";
/*
carStatus:
  "idle": 空闲
  "running": 寻路中
  "waiting": 等待开门
  "opened": 门打开
*/
let carStatus = "idle";
let target = null;
let carPose = { floor: "5", pose: "" , room_id: ""};
let ws = null;

async function selectGoal(){
  target = calculate_goal(carPose);
  if (target) {
    if (target.roomPose.room_id == carPose.room_id) {
      carStatus = "waiting";
      const newOrderStatus = 
        target.order.status == "queueing" || target.order.status == "run_to_get" ? 
        "arrive_at_get" : "arrive_at_send";
      target.order.status = newOrderStatus;
      Orders.updateOne({ _id: new ObjectID(target.order._id) }, { $set: { status: newOrderStatus } });
      // 推送到达通知，待实现
      send_notification(target.order.user_order, "arrive");
    }
    else {
      carStatus = "running";
      carPose.room_id = "";
      const newOrderStatus = 
        target.order.status == "queueing" || target.order.status == "run_to_get" ? 
        "run_to_get" : "run_to_send";
      target.order.status = newOrderStatus;
      Orders.updateOne({ _id: new ObjectID(target.order._id) }, { $set: { status: newOrderStatus } });
      // 发送目标点给小车
      ws.send(JSON.stringify({ type: "goal", goal: target.roomPose.pose }));
    }
    return 1;
  }
  else {
    return 0;
  }
}

function setWebSocket(ws_) {
  ws = ws_;
  ws.on('message', function message(data) { 
    console.log(`Received message ${data}`);
    data = JSON.parse(data);
    if (data.type == "pose") {
      carPose.floor = data.floor;
      carPose.pose = data.pose;
    }
    else if (data.type == "arrived") {
      carStatus = "waiting";
      carPose.room_id = target.roomPose.room_id;
      const newOrderStatus = 
        target.order.status == "run_to_get" ? "arrive_at_get" : "arrive_at_send";
      Orders.updateOne({ _id: new ObjectID(target.order._id) }, { $set: { status: newOrderStatus } });
      // 推送到达通知，待实现
      send_notification(target.order.user_order, "arrive");
    }
  });
}

export { carStatus, target, selectGoal, setWebSocket, ws };
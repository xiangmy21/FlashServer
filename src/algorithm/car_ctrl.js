import { calculate_goal } from "./calculate.js";
import { Orders, ObjectId } from "../middlewares/mongo.js";
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
let carPose = { floor: "5", pose: "", room_id: "" };
let ws = null;

const startTypes = ["queueing", "run_to_get"];
const endTypes = ["arrive_at_get", "run_to_send"];
async function selectGoal() {
  target = await calculate_goal(carPose);
  if (target) {
    if (target.roomPose.room_id == carPose.room_id) {
      carStatus = "waiting";
      target.order.status = startTypes.includes(target.order.status) ?
        "arrive_at_get" : "arrive_at_send";
      Orders.updateOne({ _id: new ObjectId(target.order._id) }, { $set: { status: target.order.status } });
      // 推送到达通知，待实现
      send_notification(target.order.user_order, "arrive");
    }
    else {
      carStatus = "running";
      carPose.room_id = "";
      target.order.status = startTypes.includes(target.order.status) ?
        "run_to_get" : "run_to_send";
      Orders.updateOne({ _id: new ObjectId(target.order._id) }, { $set: { status: target.order.status } });
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
      target.order.status =
        target.order.status == "run_to_get" ? "arrive_at_get" : "arrive_at_send";
      Orders.updateOne({ _id: new ObjectId(target.order._id) }, { $set: { status: target.order.status } });
      // 推送到达通知，待实现
      send_notification(target.order.user_order, "arrive");
    }
    else if (data.type == "error") {
      console.log("Error: ", data.error);
      carStatus = "waiting";
      target = null;
      // 推送错误通知，待实现
      send_notification("admin", "error");
    }
  });
}

function setCarStatus(status) {
  carStatus = status;
}
function setTarget(target_) {
  target = target_;
}

export { carStatus, target, selectGoal, setWebSocket, setCarStatus, setTarget, ws };
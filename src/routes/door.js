import express from "express";
import { Users, Orders, ObjectId } from "../middlewares/mongo.js";
import assert from "assert";
import authenticate from "../middlewares/authenticate.js";
import * as car_ctrl from "../algorithm/car_ctrl.js";

const router = express.Router();

router.get("/status", async (req, res) => {
  // 从数据库中获取门的状态
  const status = [];
  for (let i = 0; i < 3; i++) {
    const queueing = await Orders.countDocuments({ door: i, status: "queueing" });
    const running = await Orders.countDocuments({ door: i, status: { $nin: ["queueing", "finished"] } });
    assert(running <= 1);
    let order = null;
    if (running === 1) {
      order = await Orders.findOne({ door: i, status: { $nin: ["queueing", "finished"] } });
    }
    status.push({
      status: running ? order.status : queueing ? "queueing" : "available",
      queue: queueing + running
    });
  }
  return res.json(status);
});

router.post("/open", authenticate, async (req, res) => {
  const { door } = req.body;
  assert(car_ctrl.carStatus === "waiting");
  if (req.user.username !== "admin") {
    if (!car_ctrl.target) {
      return res.status(403).send("没有正在进行中的订单，无法开门");
    }
    if (car_ctrl.target.order.door !== door) {
      return res.status(403).send("门号错误，当前进行的是" + car_ctrl.target.order.door + "号门的订单");
    }
    let user_allowed = [car_ctrl.target.order.user_order];
    const user_in_room = await Users.find(
      { room_id: car_ctrl.target.roomPose.room_id },
      { projection: { username: 1 } }
    ).toArray();
    user_allowed = user_allowed.concat(user_in_room.map(user => user.username));
    if (!user_allowed.includes(req.user.username)) {
      return res.status(403).send("非下单用户且非房间用户，无权开启此门");
    }
  }
  car_ctrl.setCarStatus("opened");
  car_ctrl.ws.send(JSON.stringify({ type: "open", door: door }));
  if (car_ctrl.target) {
    Orders.updateOne(
      { _id: new ObjectId(car_ctrl.target.order._id) },
      {
        $set: {
          status: car_ctrl.target.order.status == "arrive_at_get" ?
            "run_to_send" : "finished"
        }
      }
    );
  }
  return res.send(`${door}号门已打开`);
});

router.post("/close", async (req, res) => {
  const { door } = req.body;
  assert(car_ctrl.carStatus === "opened");
  car_ctrl.selectGoal();
  return res.send(`${door}号门已关闭`);
});

export default router;
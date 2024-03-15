import express from "express";
import { Orders, ObjectId } from "../middlewares/mongo.js";
import assert from "assert";
import authenticate from "../middlewares/authenticate.js";
import "../algorithm/car_ctrl.js";

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
  if (car_ctrl.target.order.door !== door || req.user.username !== "admin") {
    return res.status(403).send("门号错误");
  }
  car_ctrl.carStatus = "opened";
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

router.post("/pause", authenticate, async (req, res) => {
  if (req.user.username !== "admin") {
    return res.status(403).send("无权暂停小车");
  }
  car_ctrl.carStatus = "waiting";
  car_ctrl.target = null;
  car_ctrl.ws.send(JSON.stringify({ type: "cancel_goal" }));
  return res.send("小车已暂停");
});

router.post("/recover", authenticate, async (req, res) => {
  if (req.user.username !== "admin") {
    return res.status(403).send("无权恢复小车");
  }
  car_ctrl.carStatus = "idle";
  car_ctrl.selectGoal();
  return res.send("小车已恢复");
});

export default router;
import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { Orders, ObjectId } from "../middlewares/mongo.js";
import moment from "moment";
import "../algorithm/car_ctrl.js";

const router = express.Router();

router.post("/create", authenticate, async (req, res) => {
  const { room_start, room_end, door } = req.body;
  const order = {
    room_start, room_end, door,
    time_order: moment().format("YYYY-MM-DD HH:mm:ss"),
    time_start: "",
    time_end: "",
    user_order: req.user.username,
    status: "queueing"
  };
  await Orders.insertOne(order);
  res.status(201).send("订单创建成功");
  // 如果小车空闲，则开始规划路径
  if (car_ctrl.carStatus == "idle") {
    car_ctrl.selectGoal();
  }
});

router.get("/list/my_order", authenticate, async (req, res) => {
  const orders = await Orders.find({ user_order: req.user.username }).toArray();
  return res.json(orders);
});

router.get("/list/my_item", authenticate, async (req, res) => {
  const orders = await Orders.find({ room_end: req.user.room_id }).toArray();
  return res.json(orders);
});

router.get("/list/all", authenticate, async (req, res) => {
  if (req.user.username !== "admin") {
    return res.status(403).send("无权查看所有订单");
  }
  const options = { sort: { time_start: -1} };
  const orders = await Orders.find({}, options).toArray();
  return res.json(orders);
});

router.post("/cancel", authenticate, async (req, res) => {
  const { _id } = req.body;
  const order = await Orders.findOne({ _id: new ObjectId(_id) });
  if (order.user_order !== req.user.username && req.user.username !== "admin") {
    return res.status(403).send("无权取消订单");
  }
  const result = await Orders.deleteOne({ _id: new ObjectId(_id) });
  if (result.deletedCount === 0) {
    return res.status(404).send("订单不存在");
  }
  if (car_ctrl.carStatus === "running" && car_ctrl.target.order._id == _id) {
    car_ctrl.carStatus = "idle";
    car_ctrl.selectGoal();
  }
  return res.send("订单取消成功");
});

export default router;
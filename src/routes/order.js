import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { Orders } from "../middlewares/mongo.js";
import moment from "moment";
import { ObjectId } from "mongodb";

const router = express.Router();

router.post("/create", authenticate, async (req, res) => {
  const { room_start, room_end, door, code } = req.body;
  const order = {
    room_start, room_end, door, code,
    time_start: moment().format("YYYY-MM-DD HH:mm:ss"),
    time_end: "",
    user_order: req.user.username,
    status: "pending"
  };
  await Orders.insertOne(order);
  return res.status(201).send("订单创建成功");
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
  const orders = await Orders.find().toArray();
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
  return res.send("订单取消成功");
});

export default router;
import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { Orders } from "../middlewares/mongo.js";
import moment from "moment";

const router = express.Router();

router.post("/create", authenticate, async (req, res) => {
  const { room_start, room_end, door, code } = req.body;
  const order = {
    room_start, room_end, door, code,
    time_start: moment().format("YYYY-MM-DD HH:mm:ss"),
    time_end: "",
    user_order: req.user.username,
  };
  await Orders.insertOne(order);
  return res.status(201).send("订单创建成功");
});

export default router;
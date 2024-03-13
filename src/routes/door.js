import express from "express";
import { Orders } from "../middlewares/mongo.js";
import assert from "assert";

const router = express.Router();

router.get("/status", async (req, res) => {
  // 从数据库中获取门的状态
  // 如果第i个门有订单是 running/returning/failed, 则状态为 running/returning/failed
  // 否则，则状态为 pending
  // 第i个门的队列数为订单中pending的数量 + [running/returning/failed存在]
  const status = [];
  for (let i = 0; i < 3; i++) {
    const pending = await Orders.countDocuments({ door: i, status: "pending" });
    const running = await Orders.countDocuments({ door: i, status: "running" });
    const returning = await Orders.countDocuments({ door: i, status: "returning" });
    const failed = await Orders.countDocuments({ door: i, status: "failed" });
    assert(running + returning + failed <= 1, "同时只能有一个订单在进行中")
    status.push({
      status: running ? "running" : returning ? "returning" : failed ? "failed" : "pending",
      queue: pending + (running || returning || failed ? 1 : 0)
    });
  }
  return res.json(status);
});

export default router;
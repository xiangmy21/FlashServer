import express from "express";
import authenticate from "../middlewares/authenticate.js";
import * as car_ctrl from "../algorithm/car_ctrl.js";

const router = express.Router();

router.post("/pause", authenticate, async (req, res) => {
  if (req.user.username !== "admin") {
    return res.status(403).send("无权暂停小车");
  }
  car_ctrl.setCarStatus("waiting");
  car_ctrl.setTarget(null);
  car_ctrl.ws.send(JSON.stringify({ type: "cancel_goal" }));
  return res.send("小车已暂停");
});

router.post("/recover", authenticate, async (req, res) => {
  if (req.user.username !== "admin") {
    return res.status(403).send("无权恢复小车");
  }
  car_ctrl.setCarStatus("idle");
  car_ctrl.selectGoal();
  return res.send("小车已恢复");
});

export default router;
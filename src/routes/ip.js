import express from "express";
import { Users } from "../middlewares/mongo.js";
import net from "net";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.put("/update", authenticate, async (req, res) => {
  try {
    modify_ip(req.user.username, req.ip);
    return res.send("更新成功");
  } catch (err) {
    console.error(err);
    return res.status(500).send("更新失败");
  }
});

export const modify_ip = (username, ip) => {
  if (net.isIPv6(ip)) {
    ip = ip.split(":").pop();
  }
  Users.updateOne({ username }, { $set: { ip } });
}

export default router;
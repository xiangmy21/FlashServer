import express from "express";
import jwt from "jsonwebtoken";
import { Users } from "../middlewares/mongo.js";
import { modify_ip } from "./ip.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  // console.log(username, password)
  const { username, password } = req.body;
  const user = await Users.findOne({ username });
  if (!user) 
    return res.status(404).send("该用户不存在");
  if (user.password !== password)
    return res.status(401).send("密码错误");

  // 更新ip地址
  modify_ip(username, req.ip);

  // 生成token
  const token = jwt.sign({ username }, process.env.JWT_SECRET);
  return res.json({ token });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const user = await Users.findOne({ username });
  if (user) 
    return res.status(409).send("该用户已存在");
  await Users.insertOne({ username, password });
  modify_ip(username, req.ip);
  const token = jwt.sign({ username }, process.env.JWT_SECRET);
  return res.status(201).json({ token });
});

router.put("/change_password", authenticate, async (req, res) => {
  const { username, password } = req.body;
  if (req.user.username == username || req.user.username == "admin") {
    await Users.updateOne({ username }, { $set: { password } });
    return res.send("密码修改成功");
  }
  else {
    return res.status(403).send("密码修改失败");
  }
});

router.put("/change_room_id", authenticate, async (req, res) => {
  const { username, room_id } = req.body;
  if (req.user.username == "admin") {
    const result = await Users.updateOne({ username }, { $set: { room_id } });
    if (result.matchedCount === 0) {
      return res.status(404).send("该用户不存在");
    }
    return res.send("房间号修改成功");
  }
  else {
    return res.status(403).send("房间号修改失败");
  }
});

export default router;
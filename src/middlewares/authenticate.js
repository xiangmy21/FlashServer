import jwt from "jsonwebtoken";
import { Users } from "./mongo.js";

const authenticate = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).send("401 Unauthorized: Missing token");
  }
  const token = authHeader.substring(7);
  // console.log(token);
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).send("401 Unauthorized: Invalid token");
    }
    req.user = await Users.findOne({ username: decoded.username });
    next();
  });
}

export default authenticate;
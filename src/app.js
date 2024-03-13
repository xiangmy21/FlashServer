import express from 'express';
import logger from "morgan";
import userRouter from './routes/user.js';
import ipRouter from './routes/ip.js';
import orderRouter from './routes/order.js';
import doorRouter from './routes/door.js';

const app = express();
const port = 28888;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use("/user", userRouter);
app.use("/ip", ipRouter);
app.use("/order", orderRouter);
app.use("/door", doorRouter);
  
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
import express from 'express';
import logger from "morgan";
import userRouter from './routes/user.js';
import ipRouter from './routes/ip.js';
import orderRouter from './routes/order.js';
import doorRouter from './routes/door.js';
import carRouter from './routes/car.js';

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
app.use("/car", carRouter);
  
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// 与小车使用WebSocket通信
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setWebSocket } from './algorithm/car_ctrl.js';

function onSocketError(err) {
  console.error(err);
}

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', function connection(ws, request, client) {
  console.log(`Connected to user ${client}`);
  ws.on('error', console.error);
  ws.on('close', function close() {
    console.log(`Disconnected from user ${client}`);
  });
  setWebSocket(ws);
});

server.on('upgrade', function upgrade(request, socket, head) {
  socket.on('error', onSocketError);
  const key = request.headers['x-custom-key'];
  console.log("@@@: ", key, process.env.CAR_SECRET_KEY);
  if (key !== process.env.CAR_SECRET_KEY){
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  socket.removeListener('error', onSocketError);

  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request, "car");
  });
});

server.listen(27777);
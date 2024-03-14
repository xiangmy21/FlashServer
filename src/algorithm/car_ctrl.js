
let carStatus = { status: "idle" };
let carPose = { floor: "5", pose: "" };

let ws = null;

function setWebSocket(ws_) {
  ws = ws_;
  ws.on('message', function message(data) { 
    console.log(`Received message ${data}`);
    data = JSON.parse(data);
    if (data.type == "pose") {
      carPose.floor = data.floor;
      carPose.pose = data.pose;
    }
    else if (data.type == "arrived") {
      carStatus.status = "pause";
    }
  });
}

function getWebSocket() {
  return ws;
}

export { setWebSocket, getWebSocket };
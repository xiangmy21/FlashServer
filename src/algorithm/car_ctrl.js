let ws = null;

function setWebSocket(ws_) {
  ws = ws_;
  ws.on('message', function message(data) { 
    console.log(`Received message ${data}`);
    data = JSON.parse(data);
    
  });
}

function getWebSocket() {
  return ws;
}

export { setWebSocket, getWebSocket };
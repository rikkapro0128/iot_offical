import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const port = 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

io.on('connection', (socket) => {
  console.log(`Node ESP8266 by ID: ${socket.id} is connected!`);

  socket.on('_node_esp8266_change_data_', (raw_data) => {
    console.log(raw_data);
  });

});

httpServer.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});
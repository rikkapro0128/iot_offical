import express from "express";
import http from 'http';
import { WebSocketServer } from 'ws';

import connectMongoDB from './db/connect.js';
import nodeEvent from './nodeEvent/index.js';

const port = 3000;
const connections = {};
const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server, clientTracking: false });

connectMongoDB(); // config connect to database mongoDB

wss.on('connection', function connection(ws, req) {

  nodeEvent(ws, req, connections);

});

server.listen(port, () => {
  console.log(`Server express listening on port: ${port}`);
});

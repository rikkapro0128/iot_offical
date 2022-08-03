import express from "express";
import http from 'http';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

import connectMongoDB from './db/connect.js';
import nodeEvent from './nodeEvent/index.js';
import configRouter from './router/index.js'; 

dotenv.config();
const port = process.env.PORT || 3000;
const connections = {};
const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server, clientTracking: false });

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json())
configRouter(app);
connectMongoDB(); // config connect to database mongoDB

wss.on('connection', function connection(ws, req) {

  nodeEvent(ws, req, connections);

});

server.listen(port, () => {
  console.log(`[💓]Server express listening on port: ${port}`);
});

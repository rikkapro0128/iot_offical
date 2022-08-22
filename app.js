import express from "express";
import http from 'http';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { EventEmitter } from 'events';

import connectMongoDB from './db/connect.js';
import socketEvent from './socketEvent/index.js';
import configRouter from './router/index.js';
import help from './ultils/index.js'; 

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const eventSystem = new EventEmitter();

const wss = new WebSocketServer({ server, clientTracking: true });

app.use(cors());
app.use(morgan('dev'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json())
configRouter(app);
app.use(help.handleError);
connectMongoDB(); // config connect to database mongoDB

wss.on('connection', function connection(ws, req) {

  socketEvent(ws, req, eventSystem);
  ws.on('pong', function () { this.isAlive = true; });
  
});

help.detachBrokenConection({ wss });

server.listen(port, () => {
  console.log(`[💓]Server express listening on port: ${port}`);
});

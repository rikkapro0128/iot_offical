import express from "express";
import http from 'http';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

import connectMongoDB from './db/connect.js';
import socketEvent from './socketEvent/index.js';
import configRouter from './router/index.js';
import help from './ultils/index.js'; 

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const eventSystem = new EventEmitter();

const wss = new WebSocketServer({ server, clientTracking: true });

app.use('/static/common', express.static('D:/Icon8/Common'));
app.use('/static/chip', express.static('D:/Icon8/Chip - SVG'));
app.use('/static/avatar', express.static('D:/Icon8/Avatar 2D Color - SVG'));
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

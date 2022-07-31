// import express from "express";
import { WebSocketServer } from 'ws';

import connectMongoDB from './db/connect.js';
import nodeEvent from './nodeEvent/index.js';

const port = 3000;

const wss = new WebSocketServer({ port });

connectMongoDB(); // config connect to database mongoDB

wss.on('connection', function connection(ws, req) {

  nodeEvent(ws, req);

});

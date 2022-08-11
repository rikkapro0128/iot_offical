import express from "express";
const Router = express.Router();

import { Node } from '../../controller/index.js'

Router.get('/list', Node.list);
Router.post('/create', Node.create);

export default Router;
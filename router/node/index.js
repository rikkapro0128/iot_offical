import express from "express";
const Router = express.Router();

import { Node } from '../../controller/index.js'

Router.get('/list', Node.list);
Router.get('/:id', Node.provider);
Router.post('/create', Node.create);
Router.delete('/remove/:id', Node.remove);

export default Router;
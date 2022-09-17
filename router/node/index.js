import express from "express";
const Router = express.Router();

import { Node } from '../../controller/index.js'

Router.get('/list', Node.list);
Router.get('/:id', Node.provider);
Router.get('/sensor/:id/chart', Node.chartSensor);
Router.get('/sensor/v2/:id/chart', Node.chartSensorV2);
Router.post('/create', Node.create);
Router.patch('/update', Node.updateNode);
Router.delete('/remove', Node.remove);

export default Router;
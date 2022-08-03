import express from "express";
const Router = express.Router();

import { User } from '../../controller/index.js'

Router.post('/login', User.login);
Router.post('/register', User.register);

export default Router;
import express from "express";
const Router = express.Router();

import middleware from '../../middleware/index.js';
import { User } from '../../controller/index.js'

Router.get('/info', middleware.auth, User.getInfo);
Router.get('/refresh-token', User.refreshToken);
Router.post('/login', User.login);
Router.post('/logout', User.logout);
Router.post('/register', User.register);

export default Router;
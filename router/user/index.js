import express from "express";
const Router = express.Router();

import { User } from '../../controller/index.js'

Router.get('/refresh-token', User.refreshToken);
Router.post('/login', User.login);
Router.post('/logout', User.logout);
Router.post('/register', User.register);

export default Router;
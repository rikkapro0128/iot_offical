import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { HistoryModel } from "../model/index.js";
import { historyCode } from "../diagram/historyCode.js";

class help {
  getCoupleToken({ payload }) {
    const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, {
      expiresIn: 2 * 60,
    });
    const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_JWT, {
      expiresIn: "1d" || 10 * 60,
    });
    return { token, refreshToken };
  }

  getToken({ payload }) {
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY_JWT, {
      expiresIn: 2 * 60,
    });
    return { accessToken };
  }

  handleError(err, req, res, next) {
    if (err.name === "TokenExpiredError" || err.name === "NotBeforeError") {
      res.status(403).json({ message: "token is expire!" });
    } else if (err.name === "JsonWebTokenError") {
      res.status(403).json({ message: "token is invalid!" });
    } else {
      res.status(403).json({ message: "Something went wrong!" });
    }
  }

  detachBrokenConection({ wss, timeDebound = 1000 }) {
    const interval = setInterval(function ping() {
      wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping();
      });
    }, timeDebound);

    wss.on("close", function close() {
      clearInterval(interval);
    });
  }

  checkEventNameIsExist({ nameEvent, mainEvent }) {
    return mainEvent.eventNames().includes(nameEvent);
  }

  async createHistory({ bind, action, desc = '', options = {} }) {
    const create = HistoryModel.User({
      desc,
      options,
      bindUser: bind,
      typeAction: action,
      action: historyCode[action],
    });
    return await create.save();
  }
}

export default new help();

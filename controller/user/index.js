import { UserModel } from '../../model/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import help from '../../ultils/index.js';

class User {

  async login(req, res, next) { // [path: /api/user/login]
    try {
      const { name, password } = req.body;
      let errorByInfo = false;
      if(name && password) {
        const checkUser = await UserModel.User.findOne({ name });
        if(checkUser) {
          const result = await bcrypt.compare(password, checkUser.hash);
          if(result) {
            const payload = { idUser: checkUser._id, nameUser: checkUser.name };
            const { token, refreshToken } = help.getCoupleToken({ payload });
            checkUser.status = 'login';
            await checkUser.save();
            res.status(200).json({ message: 'login account successful!', accessToken: `Miru ${token}`, refreshToken: `Miru ${refreshToken}` });
          }else {
            errorByInfo = true;
          }
        }else {
          errorByInfo = true;
        }
      }else {
        errorByInfo = true;
      }
      if(errorByInfo){
        res.status(401).json({ message: 'user name or password invaild!' });
      }
    } catch (error) {
      res.status(400).json({ message: 'unspecified error!', details: error });
    }
  }

  async logout(req, res, next) { // [path: /api/user/logout]
    try {
      const token = req.headers['token'];
      if(token) {
        const { idUser, nameUser } = jwt.verify(token, process.env.SECRET_KEY_JWT);
        const checkUser = await UserModel.User.findOne({ _id: idUser, name: nameUser });
        checkUser.status = 'logout';
        await checkUser.save();
        res.status(200).json({ message: 'logout is successfull!' });
      }else {
        res.status(401).json({ message: 'token is invalid!' });
      }
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) { // [path: /api/user/register]
    try {
      const { name, email, password } = req.body;
      if(name && password) {
        const tempUser = {};
        if(name && typeof name === 'string') { tempUser['name'] = name; }
        if(email && typeof email === 'string') { tempUser['email'] = email; }
        const newUser = new UserModel.User(tempUser);
        newUser.password = password;
        await newUser.save();
        const payload = { idUser: newUser._id, nameUser: newUser.name };
        const { token, refreshToken } = help.getCoupleToken({ payload });
        res.status(200).json({ message: 'register account successful!', accessToken: `Miru ${token}`, refreshToken: `Miru ${refreshToken}` });
      }else {
        res.status(401).json({ message: 'info invalid!' });
      }
    } catch (error) {
      if(error.message.includes('E11000 duplicate key error collection')) {
        res.status(400).json({ message: 'username is duplicate!' });
      }else {
        res.status(400).json({ message: 'unspecified error!', details: error });
      }
    }
  }

  refreshToken(req, res, next) { // [path: /api/user/refresh-token]
    try {
      const refreshToken = req.headers['ref-token'];
      if(refreshToken) {
        let extractToken = refreshToken.split(' ')[1];
        const { idUser, nameUser } = jwt.verify(extractToken, process.env.SECRET_KEY_JWT);
        const { accessToken } = help.getToken({ payload: { idUser, nameUser } });
        res.status(200).json({ message: 'refresh token is successfull!', token: `Miru ${accessToken}` });
      }else {
        res.status(401).json({ message: 'not found header ref-token!' });
      }
    } catch (error) {
      next(error);
    }
  }

}

export default new User;
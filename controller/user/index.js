import { UserModel, HistoryModel } from '../../model/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import help from '../../ultils/index.js';

class User {

  async login(req, res, next) { // [POST] [path: /api/user/login]
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

  async logout(req, res, next) { // [POST] [path: /api/user/logout]
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

  async register(req, res, next) { // [POST] [path: /api/user/register]
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

  refreshToken(req, res, next) { // [GET] [path: /api/user/refresh-token]
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

  async getInfo(req, res, next) { // [GET] [path: /api/user/info]
    try {
      const idUser = req.idClientUser;
      const user = await UserModel.User.findById(idUser, '-hash -status').exec();
      if(user) {
        res.status(200).json({ message: 'response information user!', user });
      }else {
        res.status(401).json({ message: 'user not found!' });
      }
    } catch (error) {
      res.status(401).json({ message: 'something went wrong!' });
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const idUser = req.idClientUser;
      if(!oldPassword) { res.status(403).json({ message: 'field {oldPassword} is undefined!' }); }
      if(!newPassword) { res.status(403).json({ message: 'field {newPassword} is undefined!' }); }
      // next to change password
      const getUser = await UserModel.User.findById(idUser, 'hash');
      const isCorrect = bcrypt.compareSync(oldPassword, getUser.hash); // true
      if(isCorrect) {
        // change password sucessfull
        getUser.password = newPassword;
        await getUser.save()
        res.status(200).json({ message: 'change pass successful!' });
      }else {
        res.status(403).json({ message: 'field {oldPassword} is wrong!' })
      }
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: 'something went wrong!' });
    }
  }

  async getNotify(req, res, next) {
    try {
      const { limit = 10, skip = 0, sort = 'asc' } = req.query;
      const idUser = req.idClientUser;
      const notifys = await HistoryModel.User.find({ bindUser: idUser }).limit(limit).skip(skip).sort({ 'createdAt': sort === 'desc' ? -1 : 1 });
      res.status(200).json({ message: 'get notify successful!', skipPresent: skip, skipNext: parseInt(skip) + parseInt(limit), length: notifys.length, notifys});
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: 'something went wrong!' });
    }
  }

}


export default new User;
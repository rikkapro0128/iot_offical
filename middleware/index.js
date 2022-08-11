import jwt from 'jsonwebtoken';

class middleware {

  auth(req, res, next) {
    const token = req.headers['authorization'];
    if(token) {
      const extractToken = token.split(' ')[1];
      try {
        const payload = jwt.verify(extractToken, process.env.SECRET_KEY_JWT);
        req.idClientUser = payload.idUser;
        next();
      } catch (error) {
        next(error);
      }
    }else {
      res.status(401).json({ message: 'not found header authorization!' });
    }
  }

}

export default new middleware;
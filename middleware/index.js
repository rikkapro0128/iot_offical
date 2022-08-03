import jwt from 'jsonwebtoken';

class middleware {

  auth(req, res, next) {
    const token = req.headers['authorization'];
    if(typeof token === 'string' && token) {
      const extractToken = token.split(' ')[1];
      try {
        const payload = jwt.verify(extractToken, process.env.SECRET_KEY_JWT);
        req.idClientUser = payload.idUser;
        next();
      } catch (error) {
        if(error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
          res.status(403).json({ message: 'token is expire!' });
        }
        else if(error.name === 'JsonWebTokenError') {
          res.status(403).json({ message: 'token is invalid!' });
        }
        else {
          res.status(403).json({ message: 'unspecified error!' });
        }
      }
    }
  }

}

export default new middleware;
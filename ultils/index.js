import jwt from 'jsonwebtoken';

class help {

  getCoupleToken({ payload }) {
    const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: 2 * 60 });
    const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: 10 * 60 });
    return { token, refreshToken };
  }

  getToken({ payload }) {
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: 2 * 60 });
    return { accessToken };
  }

  handleError(err, req, res, next) {
    if(err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      res.status(403).json({ message: 'token is expire!' });
    }
    else if(err.name === 'JsonWebTokenError') {
      res.status(403).json({ message: 'token is invalid!' });
    } else {
      res.status(403).json({ message: 'Something went wrong!' });
    }
  }

}

export default new help;
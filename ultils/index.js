import jwt from 'jsonwebtoken';

class help {

  getCoupleToken({ payload }) {
    const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: 2 * 60 });
    const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: 10 * 60 });
    return { token, refreshToken };
  }

}

export default new help;
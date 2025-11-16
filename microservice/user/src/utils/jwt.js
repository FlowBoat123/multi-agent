const jwt = require("jsonwebtoken");

module.exports = {
  createAccessToken: (data) => {
    const { JWT_SECRET_ACCESS_TOKEN, JWT_ACCESS_TOKEN_EXPIRE } = process.env;
    const token = jwt.sign(data, JWT_SECRET_ACCESS_TOKEN, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRE,
    });
    return token;
  },

  createRefreshToken: (data) => {
    const { JWT_SECRET_REFRESH_TOKEN, JWT_REFRESH_TOKEN_EXPIRE } = process.env;
    const token = jwt.sign(data, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: JWT_REFRESH_TOKEN_EXPIRE,
    });
    return token;
  },

  decodeAccessToken: (token) => {
    const { JWT_SECRET_ACCESS_TOKEN } = process.env;
    const decoded = jwt.verify(token, JWT_SECRET_ACCESS_TOKEN);
    return decoded;
  },

  decodeRefreshToken: (token) => {
    const { JWT_SECRET_REFRESH_TOKEN } = process.env;
    const decoded = jwt.verify(token, JWT_SECRET_REFRESH_TOKEN);
    return decoded;
  },
};

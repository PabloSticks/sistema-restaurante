import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "palabra_secreta_super_segura";

export const createAccessToken = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      SECRET_KEY,
      { expiresIn: "1d" }, // El token dura 1 día
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });
};
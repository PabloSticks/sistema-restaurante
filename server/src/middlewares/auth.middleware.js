import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "palabra_secreta_super_segura";

export const verifyToken = (req, res, next) => {
  try {
    // 1. Buscamos el token en los headers (Authorization: Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No autorizado. Falta el token." });
    }

    // 2. Verificamos si es real
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Token inválido o expirado." });
      
      // 3. Guardamos la info del usuario en la petición para usarla luego
      req.user = decoded; 
      next(); // ¡Pase adelante!
    });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado." });
  }
};

export const verifyAdmin = (req, res, next) => {
  // Esta se usa DESPUÉS de verifyToken
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ message: "Acceso denegado. Se requiere ser Administrador." });
  }
  next();
};
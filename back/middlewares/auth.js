import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const requireSignin = async (req, res, next) => {
  // let token;
  // if (
  //   req.headers.authorization &&
  //   req.headers.authorization.startsWith("Bearer")
  // ) {
  //   token = req.headers.authorization.split(" ")[1];
  // }

  // if (!token) {
  //   return res.status(401).json({ error: "La cle n'existe pas" });
  // }
  try {
    const decoded = jwt.verify(req.headers.authorization, JWT_SECRET);
    req.user = decoded; //req.user._id
    next();
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Clé d'accès invalide ou expirée.",
    });
  }
};

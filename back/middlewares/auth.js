import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const requireSignin = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.headers.authorization, JWT_SECRET);
    req.user = decoded; //req.user._id
    next();
  } catch (err) {
    console.log(err);
    res.json({
      error: "Clé d'accès invalide ou expirée.",
    });
  }
};

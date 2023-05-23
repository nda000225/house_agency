import jwt from "jsonwebtoken";
import * as config from "../config.js";


export const requireSignin = (req, res, next) => {

  try {
    const decoded = jwt.verify(req.headers.authorization, config.JWT_SECRET);
    req.user = decoded; //req.user._id
    next();
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Clé d'accès invalide ou expirée.",
    });
  }
};

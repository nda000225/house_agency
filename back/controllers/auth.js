import * as config from "../config.js";
import jwt from "jsonwebtoken";
import validator from 'email-validator'
import { emailTemplate } from "../helpers/email.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import User from "../models/User.js";


export const preRegister = async (req, res) => {
  /**
   * créer jwt avec e-mail et mot de passe puis e-mail en tant que lien cliquable
   * uniquement lorsque l'utilisateur clique sur ce lien e-mail, l'inscription est terminée
   */
  try {
    const { email, password } = req.body;
    if(!validator.validate(email)){
      return res.json({ error: "Une adresse courriel valide est requise"});
    }
    if(!password){
      return res.json({ error: "Mot de passe requis"});
    }
    if(password && password?.length < 6){
      return res.json({ error: "Mot de passe doit comprendre au moins 6 caractères"});
    }

    const user = await User.findOne({email})
    if(user){
      return res.json({error: "Cette addresse exist déjà"})
    }
    const token = jwt.sign({ email, password }, config.JWT_SECRET, {
      expiresIn: "1h",
    });

    config.AWSSES.sendEmail(
      emailTemplate(
        email,
        `
        <p>Veuillez cliquer sur le lien ci-dessous pour activer votre compte.</p>
        <a href="${config.CLIENT_URL}/auth/account-activate/${token}">Activation de mon compte</a>
        `,
        config.REPLY_TO,
        "Activation de votre compte"
      ),
      (err, data) => {
        if (err) {
          console.log(err);
          return res.json({ ok: false });
        } else {
          console.log(data);
          return res.json({ ok: true });
        }
      }
    );
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Quelque chose s'est mal passé. Essayer à nouveau.",
    });
  }
};

export const register = async (req, res) => {
  try {
    /**decoded token */
    const { email, password } = jwt.verify(req.body.token, config.JWT_SECRET);

    const hashedPassword = await hashPassword(password);
    const user = new User({
      username: nanoid(6),
      email,
      password: hashedPassword,
    }).save();

    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.password = undefined;
    user.resetCode = undefined;

    return res.json({ token, refreshToken, user });
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Quelque chose s'est mal passé. Essayer à nouveau.",
    });
  }
};

import * as config from "../config.js";
import jwt from "jsonwebtoken";
import { emailTemplate } from "../helpers/email.js";

export const preRegister = async (req, res) => {
  //créer jwt avec e-mail et mot de passe puis e-mail en tant que lien cliquable
  //uniquement lorsque l'utilisateur clique sur ce lien e-mail, l'inscription est terminée
  try {
    const { email, passord } = req.body;
    const token = jwt.sign({ email, passord }, config.JWT_SECRET, {
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
    console.log(req.body);
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Quelque chose s'est mal passé. Essayer à nouveau.",
    });
  }
};

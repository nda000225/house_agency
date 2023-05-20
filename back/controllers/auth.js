import * as config from "../config.js";
import jwt from "jsonwebtoken";
import validator from "email-validator";
import { emailTemplate } from "../helpers/email.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import User from "../models/User.js";

const tokenAndUserResponse = (req, res, user) => {
  const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  user.password = undefined;
  user.resetCode = undefined;

  res.json({
    user,
    token,
    refreshToken,
  });
};

export const preRegister = async (req, res) => {
  /**
   * créer jwt avec e-mail et mot de passe puis e-mail en tant que lien cliquable
   * uniquement lorsque l'utilisateur clique sur ce lien e-mail, l'inscription est terminée
   */
  try {
    const { email, password } = req.body;
    if (!validator.validate(email)) {
      return res.json({ error: "Une adresse mail valide est requise" });
    }
    if (!password) {
      return res.json({ error: "Mot de passe requis" });
    }
    if (password && password?.length < 6) {
      return res.json({
        error: "Mot de passe doit comprendre au moins 6 caractères",
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.json({ error: "Cette addresse exist déjà" });
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
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.json({ error: "Cette addresse exist déjà" });
    }

    const hashedPassword = await hashPassword(password);
    const user = new User({
      username: nanoid(6),
      email,
      password: hashedPassword,
    }).save();

    tokenAndUserResponse(req, res, user);
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Quelque chose s'est mal passé. Essayer à nouveau.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validator.validate(email)) {
      return res.json({ error: "Une adresse mail valide est requise" });
    }
    if (!password) {
      return res.json({ error: "Mot de passe requis" });
    }
    if (password && password?.length < 6) {
      return res.json({
        error: "Mot de passe doit comprendre au moins 6 caractères",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "Veuillez d'abord vous inscrire." });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: "Mauvais mot de passe",
      });
    }

    tokenAndUserResponse(req, res, user);
  } catch (err) {
    console.log(err);
    res.json({ error: "Quelque chose s'est mal passé. Essayer à nouveau." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validator.validate(email)) {
      return res.json({ error: "Une adresse mail valide est requise" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.json({
        error: "Impossible de trouver l'utilisateur avec cet e-mail",
      });
    } else {
      const resetCode = nanoid();

      const token = jwt.sign({ resetCode }, config.JWT_SECRET, {
        expiresIn: "60m",
      });

      user.resetCode = resetCode;
      user.save();

      config.AWSSES.sendEmail(
        emailTemplate(
          email,
          `
        <p>Veuillez cliquer sur le lien ci-dessous pour accéder à votre compte.</p>
        <a href="${config.CLIENT_URL}/auth/access-password/${token}">Accéder à mon compte</a>
    `,
          config.REPLY_TO,
          "Accéder à votre compte"
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
    }
  } catch (err) {
    console.log(err);
    res.json({ error: "Quelque chose s'est mal passé. Essayer à nouveau." });
  }
};

export const accessAccount = async (req, res) => {
  try {
    const { resetCode } = jwt.verify(req.body.resetCode, config.JWT_SECRET);
    const user = await User.findOneAndUpdate({ resetCode }, { resetCode: "" });

    tokenAndUserResponse(req, res, user);
  } catch (err) {
    console.log(err);
    res.json({ error: "Quelque chose s'est mal passé. Essayer à nouveau." });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { _id } = jwt.verify(req.headers.refresh_token, config.JWT_SECRET);

    const user = await User.findById({ _id });

    tokenAndUserResponse(req, res, user);
  } catch (err) {
    console.log(err);
    return res
      .status(403)
      .json({ error: "Echec d'actualisation de la clé d'accès" });
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.password = undefined;
    user.resetCode = undefined;
    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(403).json({ error: "Vous n'etes pas autorisés" });
  }
};

export const publicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    user.password = undefined;
    user.resetCode = undefined;
    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.json({ error: "Utilisateur non trouvé" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.json({ error: "Mot de passe requis" });
    }
    if (password && password?.length < 6) {
      return res.json({
        error: "Mot de passe doit comprendre au moins 6 caractères",
      });
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
      password: await hashPassword(password),
    });
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(403).json({ error: "Vous n'etes pas autorisés" });
  }
};

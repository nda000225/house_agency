import * as config from "../config.js";

export const preRegister = async (req, res) => {
  //créer jwt avec e-mail et mot de passe puis e-mail en tant que lien cliquable
  //uniquement lorsque l'utilisateur clique sur ce lien e-mail, l'inscription est terminée
  try {
    console.log(req.body);
    config.AWSSES.sendEmail(
      {
        Source: config.EMAIL_FROM,
        Destination: {
          ToAddresses: ["nda000225@gmail.com"],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `
              <h1>Bienvenue à HOUSE AGENCY</h1>
              `,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Bienvenue à HOUSE AGENCY",
          },
        },
      },
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

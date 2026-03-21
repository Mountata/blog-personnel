/**
 * Template HTML pour l'email OTP Your'Blog
 * Usage : otpEmailTemplate(otp)
 */
const otpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Code de vérification - Your'Blog</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;
                 box-shadow:0 8px 40px rgba(37,99,235,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#0ea5e9);
                        padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-size:32px;color:#ffffff;
                          font-family:Georgia,serif;letter-spacing:-1px;">
                Your'Blog
              </h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">
                Réinitialisation du mot de passe
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:600;">
                Bonjour 👋
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                Vous avez demandé à réinitialiser votre mot de passe.<br/>
                Voici votre code de vérification à usage unique :
              </p>

              <!-- OTP Box -->
              <div style="background:#f0f4ff;border:2px dashed #93c5fd;
                           border-radius:14px;padding:28px;text-align:center;
                           margin-bottom:28px;">
                <span style="font-size:42px;font-weight:800;letter-spacing:10px;
                              color:#2563eb;font-family:'Courier New',monospace;">
                  ${otp}
                </span>
                <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">
                  Ce code expire dans <strong>10 minutes</strong>
                </p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.6;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                Votre mot de passe reste inchangé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;
                        border-top:1px solid #e8edf5;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Your'Blog — Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

module.exports = otpEmailTemplate;
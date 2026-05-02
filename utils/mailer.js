const nodemailer = require("nodemailer");

const APP_NAME = process.env.APP_NAME || "MiniMinds";

// IMPORTANT: EMAIL_FROM should be ONLY an email address in .env
// Example: EMAIL_FROM=keharawijesinghe@gmail.com
const FROM_EMAIL =
  (process.env.EMAIL_FROM && String(process.env.EMAIL_FROM).trim()) ||
  (process.env.EMAIL_USER && String(process.env.EMAIL_USER).trim());

// Gmail friendly base URL for your app (backend)
const APP_URL = process.env.APP_URL || "http://localhost:5000";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function fromLine() {
  // Always force a valid "Name <email>" format
  return `${JSON.stringify(APP_NAME)} <${FROM_EMAIL}>`;
}

/**
 * Simple button template
 */
function emailTemplate({ title, intro, bodyHtml, buttonText, buttonLink, outro }) {
  return `
  <div style="background:#f6f9fc;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.08)">
      <tr>
        <td style="padding:18px 22px;background:linear-gradient(90deg,#0ea5e9,#10b981);color:#ffffff;">
          <div style="font-size:18px;font-weight:800;letter-spacing:0.2px;">${APP_NAME}</div>
          <div style="font-size:13px;opacity:0.95;margin-top:2px;">Kids Science Learning Platform</div>
        </td>
      </tr>

      <tr>
        <td style="padding:22px;">
          <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;line-height:1.3;">${title}</h2>
          <p style="margin:0 0 14px 0;color:#334155;font-size:14px;line-height:1.6;">${intro}</p>

          ${bodyHtml || ""}

          ${buttonLink
      ? `
            <div style="margin:18px 0 14px 0;">
              <a href="${buttonLink}" target="_blank"
                 style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;
                 padding:12px 16px;border-radius:12px;font-weight:800;font-size:14px;">
                 ${buttonText || "Open"}
              </a>
            </div>
            <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
              If the button doesn’t work, copy and paste this link into your browser:
              <br/>
              <span style="word-break:break-all;">${buttonLink}</span>
            </p>
          `
      : ""
    }

          ${outro
      ? `<p style="margin:16px 0 0 0;color:#334155;font-size:14px;line-height:1.6;">${outro}</p>`
      : ""
    }
        </td>
      </tr>

      <tr>
        <td style="padding:16px 22px;background:#f1f5f9;color:#64748b;font-size:12px;line-height:1.6;">
          <div><b>${APP_NAME}</b> • Made for Kids • SDG 4 Quality Education</div>
          <div style="margin-top:6px;">If you didn’t request this email, you can safely ignore it.</div>
        </td>
      </tr>
    </table>

    <div style="max-width:600px;margin:10px auto 0 auto;color:#94a3b8;font-size:11px;text-align:center;">
      © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    </div>
  </div>`;
}

async function sendVerificationEmail(email, token) {
  const link = `${APP_URL}/api/auth/verify/${token}`;

  const html = emailTemplate({
    title: "Verify your email address ✅",
    intro: "Thanks for joining MiniMinds! Please confirm your email to activate your account.",
    buttonText: "Verify Email",
    buttonLink: link,
    outro: "Once verified, you can log in and start your science journey 🚀",
  });

  await transporter.sendMail({
    from: fromLine(),
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    html,
  });
}

async function sendResetPasswordEmail(email, token) {
  const link = `${APP_URL}/api/auth/reset-password/${token}`;

  const html = emailTemplate({
    title: "Reset your password 🔐",
    intro: "We received a request to reset your password. If this was you, click below.",
    buttonText: "Reset Password",
    buttonLink: link,
    outro: "For security, this link will expire soon. If you didn’t request it, ignore this email.",
  });

  await transporter.sendMail({
    from: fromLine(),
    to: email,
    subject: `${APP_NAME} — Password Reset`,
    html,
  });
}

async function sendFeedbackConfirmation(email, name, experimentTitle, rating) {
  const bodyHtml = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-top:12px;">
      <div style="font-weight:800;color:#0f172a;font-size:14px;">Feedback Summary</div>
      <div style="margin-top:8px;color:#334155;font-size:14px;line-height:1.6;">
        <div><b>Kid:</b> ${name || "Student"}</div>
        <div><b>Experiment:</b> ${experimentTitle}</div>
        <div><b>Rating:</b> ${rating}/5 ⭐</div>
      </div>
    </div>
  `;

  const html = emailTemplate({
    title: "Thanks for your feedback! 🧪",
    intro: "We appreciate your feedback — it helps us improve the experiments for everyone.",
    bodyHtml,
    outro: "Keep exploring and learning. Great job! 🌟",
  });

  await transporter.sendMail({
    from: fromLine(),
    to: email,
    subject: `${APP_NAME} — Feedback Received ✅`,
    html,
  });
}

async function sendBadgeEarned(email, name, badge, totalCompleted) {
  const bodyHtml = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;margin-top:12px;">
      <div style="font-weight:900;color:#9a3412;font-size:16px;text-align:center;">🏅 New Badge Unlocked</div>
      <div style="margin-top:10px;color:#7c2d12;font-size:14px;line-height:1.6;text-align:center;">
        <div style="font-size:22px;font-weight:900;margin:8px 0;">${badge}</div>
        <div>You completed <b>${totalCompleted}</b> experiments 🎉</div>
      </div>
    </div>
  `;

  const html = emailTemplate({
    title: `Congratulations, ${name || "Student"}! 🎉`,
    intro: "You just earned a new badge for your amazing learning progress.",
    bodyHtml,
    outro: "Keep going — more badges are waiting for you! 🚀",
  });

  await transporter.sendMail({
    from: fromLine(),
    to: email,
    subject: `${APP_NAME} — Badge Earned: ${badge} 🏅`,
    html,
  });
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendFeedbackConfirmation,
  sendBadgeEarned,
};
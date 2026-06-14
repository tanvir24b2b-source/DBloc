import nodemailer from "nodemailer";
import EmailSettings from "../models/EmailSettings.js";

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v ?? ""),
    template
  );
}

export async function sendEmail(to, templateKey, vars = {}) {
  const settings = await EmailSettings.findById("email");
  if (!settings?.enabled || !settings.host || !settings.user || !settings.pass) return;

  const template = settings.templates?.[templateKey];
  if (!template) return;

  const text = fillTemplate(template, vars);

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port || 465,
    secure: settings.secure !== false,
    auth: { user: settings.user, pass: settings.pass },
  });

  try {
    await transporter.sendMail({
      from: `"${settings.fromName || "D BLOC"}" <${settings.user}>`,
      to,
      subject: vars.subject || "D BLOC — Order Update",
      text,
    });
  } catch (err) {
    console.error("[Email] Failed to send:", err.message);
  }
}

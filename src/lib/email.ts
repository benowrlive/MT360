import "server-only";
import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM = process.env.EMAIL_FROM || "Mindful Therapy 360 <noreply@resend.dev>";

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  const client = getResend();

  const subject = "Reset your Mindful Therapy 360 password";
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #5B4CFF; margin-bottom: 8px;">Mindful Therapy 360</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background: #5B4CFF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
      <p style="color: #9CA3AF; font-size: 12px;">
        Mindful Therapy 360 — A Special Education Suite
      </p>
    </div>
  `;

  if (client) {
    await client.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    });
  } else {
    // No email provider configured — log the link (dev mode)
    console.log("\n📧 Password reset email (no RESEND_API_KEY configured, logging instead):");
    console.log(`   To: ${email}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Reset URL: ${resetUrl}\n`);
  }
}

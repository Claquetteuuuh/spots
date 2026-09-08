import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@therightspot.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const resend = getResend();

  if (!resend) {
    // Log the email in dev so developers can grab the link from the console
    console.warn("[email] RESEND_API_KEY not set — logging email instead of sending");
    console.info(`[email] To: ${to}`);
    console.info(`[email] Subject: ${subject}`);
    console.info(`[email] Body:\n${html}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Failed to send:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Send a password-reset email with a tokenized link.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to,
    subject: "Reset your password — The Right Spot",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1A1A18; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
          Reset your password
        </h2>
        <p style="color: #6B6960; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          You requested a password reset for your The Right Spot account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #8B7355; color: #fff; text-decoration: none;
                  padding: 12px 24px; border-radius: 2px; font-size: 14px; font-weight: 500;">
          Reset password
        </a>
        <p style="color: #9C978C; font-size: 12px; line-height: 1.5; margin: 32px 0 0;">
          If you didn't request this, you can safely ignore this email.
          Your password won't change until you click the link above and create a new one.
        </p>
      </div>
    `,
  });
}

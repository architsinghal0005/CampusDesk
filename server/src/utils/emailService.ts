import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'CampusDesk Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Hello,</h2>
        <p>Your verification code for logging into CampusDesk is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 20px 0; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you did not request this email, please ignore it.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

import nodemailer from "nodemailer";

const FROM_ADDRESS =
  process.env.SMTP_FROM || '"CampusDesk" <no-reply@campusdesk.edu>';

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporterPromise: Promise<MailTransporter> | null = null;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    );
  }

  return transporterPromise;
}

export async function sendCampusDeskMail({
  to,
  subject,
  text,
  html,
}: MailOptions) {
  console.log("D. Before getTransporter");
  const transporter = await getTransporter();
  console.log("E. After getTransporter");

  console.log("F. Before sendMail");

  const info = await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    text,
    html,
  });
  console.log("G. After sendMail");

  return {
    info,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}

import nodemailer from 'nodemailer';

const FROM_ADDRESS = '"CampusDesk" <no-reply@campusdesk.edu>';

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
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();

      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    })();
  }

  return transporterPromise;
}

export async function sendCampusDeskMail({ to, subject, text, html }: MailOptions) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    text,
    html
  });

  return {
    info,
    previewUrl: nodemailer.getTestMessageUrl(info)
  };
}
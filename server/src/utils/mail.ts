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
    console.log("A. getTransporter called");
  if (!transporterPromise) {
    transporterPromise = (async () => {
        console.log("B. Before createTestAccount");
      const testAccount = await nodemailer.createTestAccount();
        console.log("C. After createTestAccount");

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
     console.log("D. Before getTransporter");
    const transporter = await getTransporter();
    console.log("E. After getTransporter");

  console.log("F. Before sendMail");

  const info = await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    text,
    html
  });
  console.log("G. After sendMail");


  return {
    info,
    previewUrl: nodemailer.getTestMessageUrl(info)
  };
}
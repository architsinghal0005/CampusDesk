import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendCampusDeskMail({
  to,
  subject,
  text,
  html,
}: MailOptions) {
  const { data, error } = await resend.emails.send({
    from: 'CampusDesk <onboarding@resend.dev>',
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    info: data,
    previewUrl: false,
  };
}

import { Resend } from "resend";
import ejs from "ejs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const templatePath = path.join(__dirname, "../mail", options.template);
    const html = await ejs.renderFile(templatePath, options.data);

    await resend.emails.send({
      from: "noreply@shifaas.xyz",
      to: options.email,
      subject: options.subject,
      html,
    });

    console.log(`Email sent to ${options.email}`);
  } catch (error: any) {
    console.error("Error while sending email:", error.message);
    throw new Error(error.message);
  }
};

export default sendMail;

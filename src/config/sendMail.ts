
import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const templatePath = path.join(__dirname, "../mail", options.template);
    const html: string = await ejs.renderFile(templatePath, options.data);

    await transporter.sendMail({
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      html,
    });

    console.log(` Email sent to ${options.email}`);
  } catch (error: any) {
    console.error(" Error while sending email:", error.message);
    throw new Error(error.message);
  }
};

export default sendMail;

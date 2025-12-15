
import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const templatePath = path.join(__dirname, "../mail", options.template);

    const html: string = await ejs.renderFile(templatePath, options.data);

    await sgMail.send({
      to: options.email,
      from: process.env.SENDGRID_FROM_EMAIL!, // verified sender
      subject: options.subject,
      html,
    });

    console.log(`✅ Email sent to ${options.email}`);
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message);
    throw new Error(error.message);
  }
};

export default sendMail;

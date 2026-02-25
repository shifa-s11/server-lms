
// import sgMail from "@sendgrid/mail";
// import ejs from "ejs";
// import path from "path";

// interface EmailOptions {
//   email: string;
//   subject: string;
//   template: string;
//   data: { [key: string]: any };
// }

// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// const sendMail = async (options: EmailOptions): Promise<void> => {
//   try {
//     const templatePath = path.join(__dirname, "../mail", options.template);

//     const html: string = await ejs.renderFile(templatePath, options.data);

//     await sgMail.send({
//       to: options.email,
//       from: process.env.SENDGRID_FROM_EMAIL!, // verified sender
//       subject: options.subject,
//       html,
//     });

//     console.log(`✅ Email sent to ${options.email}`);
//   } catch (error: any) {
//     console.error("❌ Error sending email:", error.message);
//     throw new Error(error.message);
//   }
// };

// export default sendMail;

import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

// 🔒 Validate env variables once at startup
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is missing in environment variables");
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  throw new Error("SENDGRID_FROM_EMAIL is missing in environment variables");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    // 📁 Resolve template path
    const templatePath = path.join(
      __dirname,
      "../mail",
      options.template
    );

    // 🖨 Render EJS template
    const html: string = await ejs.renderFile(
      templatePath,
      options.data
    );

    // 📤 Send email via SendGrid API
    await sgMail.send({
      to: options.email,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject: options.subject,
      text: "Please view this email in an HTML-compatible client.",
      html,
    });

    console.log(`✅ Email sent to ${options.email}`);
  } catch (error: any) {
    console.error(
      "❌ SendGrid Error:",
      error.response?.body || error.message
    );
    throw new Error("Email sending failed");
  }
};

export default sendMail;
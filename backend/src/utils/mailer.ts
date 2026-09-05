import nodemailer from 'nodemailer';

// Kumukuha tayo ng credentials mula sa .env file para secure!
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CLINIC_EMAIL,
    pass: process.env.CLINIC_EMAIL_APP_PASSWORD,
  }
});

// Ginawa nating sendEmail ang pangalan para tugma sa auth.ts
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    await transporter.sendMail({
      from: `"School Clinic Portal" <${process.env.CLINIC_EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[MAILER] 📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error('[MAILER] ❌ Error sending email:', error);
  }
};
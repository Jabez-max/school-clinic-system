import nodemailer from 'nodemailer';

// Gumagamit na tayo ng Resend SMTP server
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  secure: true,
  port: 465,
  auth: {
    user: 'resend', // Laging 'resend' ang user dito
    pass: process.env.RESEND_API_KEY, // Kukunin natin ito sa Resend dashboard
  }
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    await transporter.sendMail({
      from: `"School Clinic Portal" <noreply@clinnovate.site>`, // Ito na ang bago mong custom domain!
      to,
      subject,
      html: htmlContent
    });
    console.log(`[MAILER] 📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error('[MAILER] ❌ Error sending email:', error);
  }
};
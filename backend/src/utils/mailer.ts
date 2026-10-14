import nodemailer from 'nodemailer';

// Gumagamit na tayo ng Resend SMTP server
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 2525, // 👈 BINAGO PAPUNTANG 2525
  secure: false, // 👈 BINAGO PAPUNTANG FALSE
  auth: {
    user: 'resend', 
    pass: process.env.RESEND_API_KEY, 
  }
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    await transporter.sendMail({
      from: `"School Clinic Portal" <noreply@clinnovate.site>`, 
      to,
      subject,
      html: htmlContent
    });
    console.log(`[MAILER] 📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error('[MAILER] ❌ Error sending email:', error);
  }
};
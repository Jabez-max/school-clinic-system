import { Resend } from 'resend';

// I-initialize ang Resend gamit ang iyong API Key mula sa .env
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    // Ito yung eksaktong code na nasa screenshot mo!
    const { data, error } = await resend.emails.send({
      from: 'School Clinic Portal <noreply@clinnovate.site>', // Ang verified custom domain mo
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    // Kung may error mula mismo sa Resend API
    if (error) {
      console.error('[MAILER] ❌ Resend API Error:', error);
      return;
    }

    console.log(`[MAILER] 📧 Email sent successfully to ${to} | ID:`, data?.id);
  } catch (err) {
    console.error('[MAILER] ❌ Unexpected Error sending email:', err);
  }
};
import { Resend } from 'resend';

// I-initialize ang Resend gamit ang iyong API Key mula sa .env
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'School Clinic Portal <noreply@clinnovate.site>', 
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('[MAILER] ❌ Resend API Error:', error);
      return;
    }

    console.log(`[MAILER] 📧 Email sent successfully to ${to} | ID:`, data?.id);
  } catch (err) {
    console.error('[MAILER] ❌ Unexpected Error sending email:', err);
  }
};

// BAGONG FUNCTION PARA SA SABAY-SABAY NA EMAIL (Announcements)
export const sendBatchEmails = async (emailJobs: any[]) => {
  try {
    const { data, error } = await resend.batch.send(emailJobs);
    
    if (error) {
      console.error('[MAILER] ❌ Resend Batch API Error:', error);
      return;
    }
    console.log(`[MAILER] 📢 Batch emails sent successfully! Count: ${emailJobs.length}`);
  } catch (err) {
    console.error('[MAILER] ❌ Unexpected Error sending batch emails:', err);
  }
};
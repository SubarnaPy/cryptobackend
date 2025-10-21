const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (email, subject, htmlTemplate) => {
  try {
    console.log('Sending email...');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('API Key set:', !!process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      html: htmlTemplate,
    };

    const info = await sgMail.send(msg);
    console.log('Email sent successfully');
    return info;

  } catch (error) {
    console.error('SendGrid Error Details:', error.response?.body || error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
};

// Send consultation reply email with meeting link
exports.sendConsultationReply = async ({ to, name, consultationType, meetingLink, scheduledDate, message }) => {
  console.log('\n📧 ===== PRODUCTION EMAIL SEND ATTEMPT =====');
  console.log('To:', to);
  console.log('Name:', name);
  console.log('Type:', consultationType);
  console.log('Meeting Link:', meetingLink);
  console.log('Scheduled:', scheduledDate);

  const subject = `Consultation Confirmed - ${consultationType}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Consultation Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your consultation request has been confirmed. Here are the details:</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Consultation Type:</strong> ${consultationType}</p>
        <p><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a></p>` : ''}
      </div>

      ${message ? `<p><strong>Additional Information:</strong></p><p>${message}</p>` : ''}

      <p>Please join the meeting at the scheduled time using the link provided above.</p>
      <p>If you have any questions, feel free to reply to this email.</p>

      <p>Best regards,<br>ConnectCanada.io Team</p>
    </div>
  `;

  try {
    const result = await sendMail(to, subject, htmlTemplate);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('\n❌ ===== EMAIL SEND FAILED =====');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    throw error;
  }
};

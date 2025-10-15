const nodemailer = require('nodemailer');

const sendMail = async (email, subject, htmlTemplate) => {
  try {
    // Debugging logs for environment variables
    console.log('SMTP_USERNAME:', process.env.SMTP_USERNAME);
    console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '****' : 'Not Set');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);

    console.log('Sending email...');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('HTML Template:', htmlTemplate);

    // Create a transporter using SMTP
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USERNAME || 'mannadabdas@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'vewo gbei usfv eoci', // Ensure this is correct!
      },
      timeout: 60000, // Increase timeout to 60 seconds (default is 10 seconds)
    });

    // Send the email
    let info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME,
      to: email,
      subject: subject,
      html: htmlTemplate,
    });

    console.log('Email sent:', info);
    return info; // Return the sent email info for further use, like tracking the email ID or other details

  } catch (error) {
    // Log detailed error information
    console.error('Error sending email:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to send email'); // Re-throw the error for the asyncHandler middleware to catch and return to the client
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

      <p>Best regards,<br>Canadian Nexus Team</p>
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

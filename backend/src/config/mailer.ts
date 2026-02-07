import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  if (transporter) return transporter;

  try {
    // Create a fake account for testing
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    console.log('📧 Mailer Initialized');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log(`   Preview URL: https://ethereal.email/messages`);
    
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create mailer transport:', error);
    process.exit(1);
  }
};

export const getTransporter = () => {
  if (!transporter) {
    throw new Error('Mailer not initialized. Call initMailer() first.');
  }
  return transporter;
};
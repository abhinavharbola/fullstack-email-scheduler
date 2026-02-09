import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  if (transporter) return transporter;

  try {
    // 1. Try to connect to real Ethereal API
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('📧 Mailer Initialized (Real Account Created)');
    console.log(`   Preview URL: https://ethereal.email/messages`);
    
  } catch (error) {
    // 2. Fallback: OFFLINE MODE (JSON Transport)
    // This happens if Ethereal API is down (502). 
    // We use "jsonTransport" to simulate sending without hitting the internet.
    console.warn('⚠️  Warning: Ethereal API is down. Switching to OFFLINE MOCK mode.');
    
    transporter = nodemailer.createTransport({
      jsonTransport: true // <--- This prevents the 535 Auth Error
    });
  }

  return transporter;
};

export const getTransporter = () => {
  if (!transporter) {
    throw new Error('Mailer not initialized. Call initMailer() first.');
  }
  return transporter;
};
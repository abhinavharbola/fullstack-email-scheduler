import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initMailer } from './config/mailer';
import prisma from './config/db';
import { setupWorker } from './jobs/emailWorker';
import emailRoutes from './routes/emailRoutes'; // Import Routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/emails', emailRoutes);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

const startServer = async () => {
  await initMailer();
  setupWorker();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
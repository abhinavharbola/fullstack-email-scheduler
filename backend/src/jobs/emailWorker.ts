import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { initMailer } from '../config/mailer';
import prisma from '../config/db';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');

export const setupWorker = () => {
  const worker = new Worker(
    'email-sending-queue',
    async (job: Job) => {
      console.log(`Processing job ${job.id} (DB ID: ${job.data.id})`);

      try {
        // 1. Simulate Throttling (2s delay)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 2. Send Email
        const transporter = await initMailer();
        await transporter.sendMail({
          from: '"ReachInbox Scheduler" <scheduler@reachinbox.ai>',
          to: job.data.recipient,
          subject: job.data.subject,
          text: job.data.body,
          html: `<p>${job.data.body}</p>`,
        });

        // 3. Update DB: Success
        await prisma.emailJob.update({
          where: { id: job.data.id },
          data: {
            status: 'COMPLETED',
            sentAt: new Date(),
          },
        });

        console.log(`✅ Job ${job.data.id} completed.`);

      } catch (error: any) {
        console.error(`❌ Job ${job.data.id} failed:`, error);
        
        // 4. Update DB: Failed
        await prisma.emailJob.update({
          where: { id: job.data.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error.message,
          },
        });
        
        throw error; // Let BullMQ know it failed (so it can retry if configured)
      }
    },
    {
      connection: redisConnection,
      concurrency: WORKER_CONCURRENCY,
      limiter: {
        max: 50, 
        duration: 3600000, 
      },
    }
  );

  return worker;
};
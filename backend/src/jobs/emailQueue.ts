import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// 1. Create the Queue
export const emailQueue = new Queue('email-sending-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s, then 2s, then 4s...
    },
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: false,   // Keep failed jobs for debugging
  },
});

// 2. Helper to Add Jobs to the Queue
interface EmailJobData {
  recipient: string;
  subject: string;
  body: string;
}

export const addEmailJob = async (data: EmailJobData, delayInMs: number = 0) => {
  await emailQueue.add('send-email', data, {
    delay: delayInMs, // BullMQ handles the scheduling here!
  });
  console.log(`Job added to queue for ${data.recipient} with delay ${delayInMs}ms`);
};
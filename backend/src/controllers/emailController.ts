import { Request, Response } from 'express';
import prisma from '../config/db';
import { emailQueue } from '../jobs/emailQueue';

// POST /api/emails/schedule
export const scheduleEmail = async (req: Request, res: Response) => {
  try {
    const { recipient, subject, body, scheduledTime } = req.body;

    // 1. Validate Input
    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. Calculate Delay
    // If scheduledTime is provided, calculate delay. Otherwise, 0 (immediate).
    const delay = scheduledTime 
      ? new Date(scheduledTime).getTime() - Date.now() 
      : 0;

    if (delay < 0) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // 3. Save to Database (Persistence)
    const emailJob = await prisma.emailJob.create({
      data: {
        recipient,
        subject,
        body,
        status: 'PENDING',
        scheduledAt: scheduledTime ? new Date(scheduledTime) : new Date(),
      },
    });

    // 4. Add to BullMQ Queue
    // We pass the DB ID so the worker knows which record to update later
    await emailQueue.add(
      'send-email',
      {
        id: emailJob.id, // Critical: Link DB record to Queue Job
        recipient,
        subject,
        body,
      },
      {
        delay: delay,
        removeOnComplete: true
      }
    );

    res.status(201).json({ 
      message: 'Email scheduled successfully', 
      jobId: emailJob.id 
    });

  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/emails
export const getEmails = async (req: Request, res: Response) => {
  try {
    const emails = await prisma.emailJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};
import { Router } from 'express';
import { scheduleEmail, getEmails } from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmail);
router.get('/', getEmails);

export default router;
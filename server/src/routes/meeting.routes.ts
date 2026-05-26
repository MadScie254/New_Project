import { Router } from 'express';
import { z } from 'zod';
import { meetingController } from '../controllers/meeting.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard, memberGuard } from '../middleware/role.guard';
import { validate } from '../middleware/validate';

const router = Router();

const createMeetingSchema = z.object({
  scheduledAt: z.string(),
  location: z.string().optional(),
  agenda: z.string().optional(),
});

const attendanceSchema = z.object({
  memberId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'APOLOGY']),
  fineAmount: z.number().min(0).optional(),
});

router.use(authGuard);

router.get('/:chamaId/meetings', memberGuard(), (req, res) => meetingController.getAll(req, res));
router.post('/:chamaId/meetings', roleGuard('CHAIRMAN', 'SECRETARY'), validate({ body: createMeetingSchema }), (req, res) => meetingController.create(req, res));
router.get('/:chamaId/meetings/:meetingId', memberGuard(), (req, res) => meetingController.getDetails(req, res));
router.put('/:chamaId/meetings/:meetingId', roleGuard('CHAIRMAN', 'SECRETARY'), (req, res) => meetingController.update(req, res));
router.delete('/:chamaId/meetings/:meetingId', roleGuard('CHAIRMAN'), (req, res) => meetingController.delete(req, res));
router.post('/:chamaId/meetings/:meetingId/attendance', roleGuard('SECRETARY', 'CHAIRMAN'), validate({ body: attendanceSchema }), (req, res) => meetingController.markAttendance(req, res));
router.put('/:chamaId/meetings/:meetingId/minutes', roleGuard('SECRETARY', 'CHAIRMAN'), (req, res) => meetingController.saveMinutes(req, res));

export default router;

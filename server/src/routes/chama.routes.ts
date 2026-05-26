import { Router } from 'express';
import { z } from 'zod';
import { chamaController } from '../controllers/chama.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard, memberGuard } from '../middleware/role.guard';
import { validate } from '../middleware/validate';

const router = Router();

const createChamaSchema = z.object({
  name: z.string().min(3, 'Chama name must be at least 3 characters'),
  description: z.string().optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  contribution_amount: z.number().positive('Contribution must be positive'),
  start_date: z.string(),
  max_members: z.number().int().min(2).max(100).optional(),
});

const inviteMemberSchema = z.object({
  phone: z.string().min(10),
});

const joinSchema = z.object({
  inviteCode: z.string().min(1),
});

// All routes require auth
router.use(authGuard);

router.post('/', validate({ body: createChamaSchema }), (req, res) => chamaController.create(req, res));
router.get('/', (req, res) => chamaController.getUserChamas(req, res));
router.post('/join', validate({ body: joinSchema }), (req, res) => chamaController.joinByInvite(req, res));

router.get('/:chamaId', memberGuard(), (req, res) => chamaController.getDetails(req, res));
router.put('/:chamaId', roleGuard('CHAIRMAN', 'TREASURER'), (req, res) => chamaController.updateChama(req, res));
router.get('/:chamaId/dashboard', memberGuard(), (req, res) => chamaController.getDashboard(req, res));
router.get('/:chamaId/wallet', memberGuard(), (req, res) => chamaController.getWallet(req, res));
router.post('/:chamaId/invite', roleGuard('CHAIRMAN', 'SECRETARY'), validate({ body: inviteMemberSchema }), (req, res) => chamaController.inviteMember(req, res));
router.put('/:chamaId/members/:memberId/role', roleGuard('CHAIRMAN'), (req, res) => chamaController.updateMemberRole(req, res));

export default router;

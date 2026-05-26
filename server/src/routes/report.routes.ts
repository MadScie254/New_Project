import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard } from '../middleware/role.guard';

const router = Router();

router.use(authGuard);

// All reports require Treasurer or Chairman role
router.get('/:chamaId/reports/monthly', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => reportController.getMonthlyStatement(req, res));
router.get('/:chamaId/reports/annual', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => reportController.getAnnualSummary(req, res));
router.get('/:chamaId/reports/compliance', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => reportController.getComplianceReport(req, res));
router.get('/:chamaId/reports/defaulters', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => reportController.getDefaultersReport(req, res));

export default router;

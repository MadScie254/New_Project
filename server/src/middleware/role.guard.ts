import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ChamaRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Role-based access control middleware.
 * Checks if the authenticated user has one of the allowed roles in the specified chama.
 * The chama ID is extracted from req.params.chamaId.
 */
export function roleGuard(...allowedRoles: ChamaRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const chamaId = req.params.chamaId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      if (!chamaId) {
        res.status(400).json({ error: 'Chama ID is required.' });
        return;
      }

      const membership = await prisma.chamaMember.findUnique({
        where: {
          chama_id_user_id: {
            chama_id: chamaId,
            user_id: userId,
          },
        },
      });

      if (!membership) {
        res.status(403).json({ error: 'You are not a member of this chama.' });
        return;
      }

      if (!membership.is_active) {
        res.status(403).json({ error: 'Your membership in this chama is inactive.' });
        return;
      }

      if (!allowedRoles.includes(membership.role)) {
        res.status(403).json({
          error: `Access denied. This action requires one of: ${allowedRoles.join(', ')}.`,
        });
        return;
      }

      // Attach membership to request for downstream use
      (req as any).membership = membership;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify role permissions.' });
    }
  };
}

/**
 * Membership guard — just checks if user is an active member of the chama.
 */
export function memberGuard() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const chamaId = req.params.chamaId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      if (!chamaId) {
        res.status(400).json({ error: 'Chama ID is required.' });
        return;
      }

      const membership = await prisma.chamaMember.findUnique({
        where: {
          chama_id_user_id: {
            chama_id: chamaId,
            user_id: userId,
          },
        },
      });

      if (!membership || !membership.is_active) {
        res.status(403).json({ error: 'You are not an active member of this chama.' });
        return;
      }

      (req as any).membership = membership;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify membership.' });
    }
  };
}

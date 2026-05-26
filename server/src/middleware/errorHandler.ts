import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma-specific errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        error: 'A record with this data already exists.',
        field: prismaErr.meta?.target,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: 'Record not found.' });
      return;
    }
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again later.'
      : err.message,
  });
}

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await userService.getProfile(userId);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await userService.updateProfile(userId, req.body);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    await userService.deleteAccount(userId);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({ data: { message: 'Account deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

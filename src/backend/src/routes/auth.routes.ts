import { Router } from 'express';
import passport from 'passport';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validation';
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  googleCallbackHandler,
  microsoftRedirectHandler,
  microsoftCallbackHandler,
} from '../controllers/auth.controller';

const router = Router();

// Local auth
router.post('/signup', validate(signupSchema), signupHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.post('/refresh', refreshHandler);

// Password reset
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  googleCallbackHandler as any
);

// Microsoft OAuth (MSAL-based, not Passport)
router.get('/microsoft', microsoftRedirectHandler);
router.get('/microsoft/callback', microsoftCallbackHandler);

export default router;

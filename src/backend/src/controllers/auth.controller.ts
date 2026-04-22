import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { REFRESH_TOKEN_EXPIRY_DAYS } from '../config/auth';
import '../types';

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.signup(req.body);
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({ data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
      });
      return;
    }

    const tokens = await authService.refreshToken(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      data: { accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      data: { message: 'If an account exists with that email, a reset link has been sent' },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.resetPassword(req.body.token, req.body.password);

    res.status(200).json({
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    next(error);
  }
}

export async function googleCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Passport populates req.user after Google strategy callback
    const profile = req.user as unknown as { id: string; email: string; name: string; avatarUrl?: string };

    const result = await authService.googleAuth({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });

    setRefreshTokenCookie(res, result.refreshToken);

    // Redirect to frontend with access token
    const { config } = await import('../config/env');
    res.redirect(
      `${config.FRONTEND_URL}/auth/callback?accessToken=${result.accessToken}`
    );
  } catch (error) {
    next(error);
  }
}

export async function microsoftCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).json({
        error: { code: 'MISSING_CODE', message: 'Authorization code is required' },
      });
      return;
    }

    const { config } = await import('../config/env');
    const { ConfidentialClientApplication } = await import('@azure/msal-node');

    const msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID}`,
      },
    });

    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ['user.read'],
      redirectUri: `${config.FRONTEND_URL}/api/auth/microsoft/callback`,
    });

    if (!tokenResponse || !tokenResponse.account) {
      res.status(401).json({
        error: { code: 'MS_AUTH_FAILED', message: 'Microsoft authentication failed' },
      });
      return;
    }

    const account = tokenResponse.account;
    const result = await authService.microsoftAuth({
      id: account.localAccountId,
      email: account.username,
      name: account.name || account.username,
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.redirect(
      `${config.FRONTEND_URL}/auth/callback?accessToken=${result.accessToken}`
    );
  } catch (error) {
    next(error);
  }
}

export async function microsoftRedirectHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { config } = await import('../config/env');
    const { ConfidentialClientApplication } = await import('@azure/msal-node');

    const msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID}`,
      },
    });

    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: ['user.read'],
      redirectUri: `${config.FRONTEND_URL}/api/auth/microsoft/callback`,
    });

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

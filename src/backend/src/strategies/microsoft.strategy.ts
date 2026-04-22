/**
 * Microsoft OAuth strategy using @azure/msal-node.
 *
 * Unlike Google, Microsoft auth is handled directly in the controller
 * via MSAL's ConfidentialClientApplication. This file exports a helper
 * to create and cache the MSAL client instance.
 *
 * Flow:
 *   1. GET /api/auth/microsoft -> redirect to Microsoft login
 *   2. GET /api/auth/microsoft/callback -> exchange code for tokens
 *
 * Both steps are handled in auth.controller.ts using the MSAL client below.
 */

import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { config } from '../config/env';

let msalInstance: ConfidentialClientApplication | null = null;

export function getMsalClient(): ConfidentialClientApplication {
  if (!msalInstance) {
    const msalConfig: Configuration = {
      auth: {
        clientId: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${config.MICROSOFT_TENANT_ID}`,
      },
    };

    msalInstance = new ConfidentialClientApplication(msalConfig);
  }

  return msalInstance;
}

export const MICROSOFT_SCOPES = ['user.read'];

export function getMicrosoftRedirectUri(): string {
  return `${config.FRONTEND_URL}/api/auth/microsoft/callback`;
}

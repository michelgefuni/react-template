import type { Logger } from '../logger.ts';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresInSeconds: number;
  sub: string;
  name: string;
  email: string;
}

export interface AuthTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

export interface IdentityProvider {
  createTransaction(
    returnTo: string,
  ): Promise<{ transaction: AuthTransaction; authorizationUrl: URL }>;
  exchange(
    currentUrl: URL,
    transaction: AuthTransaction,
  ): Promise<IssuedTokens>;
  refresh(refreshToken: string): Promise<IssuedTokens>;
  logoutUrl(idToken: string): string;
}

export async function retry<T>(
  attempts: number,
  delayMs: number,
  logger: Logger,
  operation: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(
        { event: 'oidc_discovery_failed', attempt },
        'oidc discovery failed',
      );
      if (attempt < attempts && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

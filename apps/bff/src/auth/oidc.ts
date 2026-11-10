import * as oidc from 'openid-client';

import type { Env } from '../config/env.ts';
import type { Logger } from '../logger.ts';
import {
  retry,
  type AuthTransaction,
  type IdentityProvider,
  type IssuedTokens,
} from './identity-provider.ts';

export function discoverIdentityProvider(
  env: Env,
  logger: Logger,
): Promise<IdentityProvider> {
  return retry(
    env.OIDC_DISCOVERY_ATTEMPTS,
    env.OIDC_DISCOVERY_DELAY_MS,
    logger,
    async () => {
      const config = await oidc.discovery(
        new URL(env.OIDC_ISSUER_URL),
        env.OIDC_CLIENT_ID,
        env.OIDC_CLIENT_SECRET,
        undefined,
        env.OIDC_ALLOW_INSECURE_HTTP === 'true'
          ? { execute: [oidc.allowInsecureRequests] }
          : undefined,
      );
      return createOpenIdProvider(config, env);
    },
  );
}

export function createOpenIdProvider(
  config: oidc.Configuration,
  env: Pick<
    Env,
    'OIDC_REDIRECT_URI' | 'OIDC_POST_LOGOUT_REDIRECT_URI' | 'OIDC_SCOPES'
  >,
): IdentityProvider {
  return {
    async createTransaction(returnTo) {
      const codeVerifier = oidc.randomPKCECodeVerifier();
      const transaction: AuthTransaction = {
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
        codeVerifier,
        returnTo,
      };
      const authorizationUrl = oidc.buildAuthorizationUrl(config, {
        redirect_uri: env.OIDC_REDIRECT_URI,
        scope: env.OIDC_SCOPES,
        code_challenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
        code_challenge_method: 'S256',
        state: transaction.state,
        nonce: transaction.nonce,
      });
      return { transaction, authorizationUrl };
    },
    async exchange(currentUrl, transaction) {
      const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: transaction.codeVerifier,
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
      });
      return toIssuedTokens(tokens);
    },
    async refresh(refreshToken) {
      return toIssuedTokens(await oidc.refreshTokenGrant(config, refreshToken));
    },
    logoutUrl(idToken) {
      return oidc
        .buildEndSessionUrl(config, {
          post_logout_redirect_uri: env.OIDC_POST_LOGOUT_REDIRECT_URI,
          id_token_hint: idToken,
        })
        .toString();
    },
  };
}

function toIssuedTokens(
  tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers,
): IssuedTokens {
  const claims = tokens.claims();
  const sub = claimString(claims, 'sub');
  if (
    !tokens.access_token ||
    !tokens.refresh_token ||
    !tokens.id_token ||
    !sub
  ) {
    throw new Error(
      'The identity provider response is missing required tokens.',
    );
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresInSeconds: tokens.expiresIn() ?? 300,
    sub,
    name:
      claimString(claims, 'name') || claimString(claims, 'preferred_username'),
    email: claimString(claims, 'email'),
  };
}

function claimString(
  claims: Record<string, unknown> | undefined,
  key: string,
): string {
  const value = claims?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Jose JWT Token Signer Adapter
 * 
 * Implementation using jose library for JWT signing and verification.
 * Uses HS256 algorithm with configurable secret.
 */

import { SignJWT, jwtVerify } from 'jose';
import type { TokenSignerPort, JWTPayload } from '@aibos/kernel-core';

export class JoseTokenSigner implements TokenSignerPort {
  private readonly secret: Uint8Array;
  private readonly algorithm = 'HS256';

  constructor(secretKey: string) {
    if (!secretKey || secretKey.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
    this.secret = new TextEncoder().encode(secretKey);
  }

  async sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, ttlSeconds: number): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
      sub: payload.sub,
      tid: payload.tid,
      sid: payload.sid,
      email: payload.email,
    })
      .setProtectedHeader({ alg: this.algorithm })
      .setIssuedAt(now)
      .setExpirationTime(now + ttlSeconds)
      .sign(this.secret);
  }

  async verify(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: [this.algorithm],
      });

      return {
        sub: payload.sub as string,
        tid: payload.tid as string,
        sid: payload.sid as string,
        email: payload.email as string,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      throw new Error('INVALID_TOKEN');
    }
  }
}

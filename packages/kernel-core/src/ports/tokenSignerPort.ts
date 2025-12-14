/**
 * Token Signer Port
 * 
 * Interface for JWT signing and verification.
 * Implementations should use jose or jsonwebtoken.
 */

export type JWTPayload = {
  sub: string; // user_id
  tid: string; // tenant_id
  sid: string; // session_id
  email: string;
  iat?: number;
  exp?: number;
};

export interface TokenSignerPort {
  /**
   * Sign a JWT with the given payload
   */
  sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, ttlSeconds: number): Promise<string>;

  /**
   * Verify and decode a JWT
   */
  verify(token: string): Promise<JWTPayload>;
}

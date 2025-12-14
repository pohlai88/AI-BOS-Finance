/**
 * Password Hasher Port
 * 
 * Interface for password hashing and verification.
 * Implementations should use bcrypt or similar.
 */

export interface PasswordHasherPort {
  /**
   * Hash a plaintext password
   */
  hash(password: string): Promise<string>;

  /**
   * Verify a password against a hash
   */
  verify(password: string, hash: string): Promise<boolean>;
}

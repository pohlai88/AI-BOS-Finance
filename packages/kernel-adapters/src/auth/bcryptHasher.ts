/**
 * Bcrypt Password Hasher Adapter
 * 
 * Implementation using bcryptjs for password hashing.
 * Uses salt rounds = 10 (balanced performance/security).
 */

import bcrypt from 'bcryptjs';
import type { PasswordHasherPort } from '@aibos/kernel-core';

export class BcryptPasswordHasher implements PasswordHasherPort {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

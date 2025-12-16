/**
 * Custom Type Declaration: UUID
 * 
 * The uuid package (v10+) provides its own TypeScript definitions.
 * However, with moduleResolution: "bundler", TypeScript may not resolve them correctly.
 * This declaration ensures proper type support following Next.js best practices.
 * 
 * @see https://nextjs.org/docs/app/api-reference/config/typescript#custom-type-declarations
 * @see CONT_09 UI/UX Architecture Contract
 */

declare module 'uuid' {
  /**
   * Generate a RFC4122 version 4 UUID
   * Uses random number generation
   */
  export function v4(): string;

  /**
   * Generate a RFC4122 version 1 UUID
   * Uses timestamp and node ID
   */
  export function v1(): string;

  /**
   * Generate a RFC4122 version 3 UUID
   * Uses MD5 hashing of namespace and name
   */
  export function v3(
    name: string | Uint8Array,
    namespace: string | Uint8Array
  ): string;

  /**
   * Generate a RFC4122 version 5 UUID
   * Uses SHA-1 hashing of namespace and name
   */
  export function v5(
    name: string | Uint8Array,
    namespace: string | Uint8Array
  ): string;

  /**
   * Generate a RFC9562 version 6 UUID
   * Reordered time-based UUID
   */
  export function v6(): string;

  /**
   * Generate a RFC9562 version 7 UUID
   * Unix Epoch time-based UUID
   */
  export function v7(): string;

  /**
   * Parse a UUID string to bytes
   */
  export function parse(uuid: string): Uint8Array;

  /**
   * Convert bytes to UUID string
   */
  export function stringify(arr: Uint8Array): string;

  /**
   * Validate a UUID string
   */
  export function validate(uuid: string): boolean;

  /**
   * Detect RFC version of a UUID
   */
  export function version(uuid: string): number;

  /**
   * The nil UUID (all zeros)
   */
  export const NIL: string;

  /**
   * The max UUID (all ones)
   */
  export const MAX: string;

  // Namespace UUIDs for v3/v5
  export namespace v3 {
    const DNS: string;
    const URL: string;
  }

  export namespace v5 {
    const DNS: string;
    const URL: string;
  }
}

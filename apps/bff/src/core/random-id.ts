export function randomId(): string {
  return globalThis.crypto.randomUUID();
}

const relativePath = /^\/(?!\/)/;

export function sanitizeReturnTo(value: string | undefined): string {
  if (
    !value ||
    !relativePath.test(value) ||
    value.includes('\\') ||
    value.includes('://')
  ) {
    return '/';
  }
  return value;
}

export const minimumPasswordLength = 8;

export function isStrongPassword(password: string) {
  return password.length >= minimumPasswordLength;
}

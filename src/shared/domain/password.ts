export const minimumPasswordLength = 12;

export function isStrongPassword(password: string) {
  return (
    password.length >= minimumPasswordLength &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

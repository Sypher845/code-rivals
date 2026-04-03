import { SenderError } from "spacetimedb/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,24}$/;

export type SignUpInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function normalizeUsername(username: string) {
  return username.trim();
}

export function normalizeUsernameKey(username: string) {
  return normalizeUsername(username).toLowerCase();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateSignUpInput({
  username,
  email,
  password,
  confirmPassword,
}: SignUpInput) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    throw new SenderError(
      "Username must be 3-24 characters and use letters, numbers, underscores, or hyphens.",
    );
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new SenderError("Enter a valid email address.");
  }

  if (password.length < 8 || password.length > 72) {
    throw new SenderError("Password must be between 8 and 72 characters.");
  }

  if (password !== confirmPassword) {
    throw new SenderError("Passwords do not match.");
  }

  return {
    normalizedUsername,
    normalizedUsernameKey: normalizeUsernameKey(normalizedUsername),
    normalizedEmail,
  };
}

export function validateLoginInput({ email, password }: LoginInput) {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail) || password.length < 8) {
    throw new SenderError("Authentication failed.");
  }

  return { normalizedEmail };
}

export function digestPassword(password: string) {
  let left = 0x811c9dc5;
  let right = 0x811c9dc5;

  for (let index = 0; index < password.length; index += 1) {
    const charCode = password.charCodeAt(index);
    left ^= charCode;
    left = Math.imul(left, 0x01000193);
    right ^= charCode + ((index + 17) % 31);
    right = Math.imul(right, 0x01000193);
  }

  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

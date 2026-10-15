import { randomUUID, randomInt } from "node:crypto";

export function newId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

// Short, easy to read over the phone or type into the "manage my booking"
// lookup form: 6 characters, uppercase letters + digits, excludes visually
// ambiguous characters (0/O, 1/I/L) since our users often read this off a
// printed or emailed confirmation.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newConfirmationCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

import { compare, hash } from 'bcrypt';

async function createHashPass(password: string) {
  return hash(password, 10);
}

async function verifyPassword(password: string, hash: string) {
  return await compare(password, hash);
}

export { createHashPass, verifyPassword };

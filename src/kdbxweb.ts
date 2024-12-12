import kdbxweb from 'kdbxweb';
import * as argon2 from 'argon2';
import { deserialize } from '@phc/format';

export async function argon2function(
  password: ArrayBuffer,
  salt: ArrayBuffer,
  memoryCost: number,
  timeCost: number,
  hashLength: number,
  parallelism: number,
  type: typeof argon2.argon2d | typeof argon2.argon2i | typeof argon2.argon2id,
  version: number,
): Promise<ArrayBuffer> {
  const hash = deserialize(
    await argon2.hash(Buffer.from(password), {
      salt: Buffer.from(salt),
      memoryCost,
      timeCost,
      hashLength,
      parallelism,
      type,
      version,
    }),
  ).hash!;
  return hash as unknown as ArrayBuffer;
}

kdbxweb.CryptoEngine.setArgon2Impl(argon2function);

export const { Credentials, ProtectedValue, Kdbx } = kdbxweb;

export type KdbxEntryField = kdbxweb.KdbxEntryField;
export type KdbxGroup = kdbxweb.KdbxGroup;
export type Kdbx = kdbxweb.Kdbx;

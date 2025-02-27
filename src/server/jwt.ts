import { createSecretKey } from 'crypto';
import { jwtVerify, SignJWT } from 'jose';

const secretKey = createSecretKey(Buffer.from('YOUR_SECRET_HERE', 'utf-8'));

export async function generateJWT(userId: string): Promise<string> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .sign(secretKey);

  return token;
}

export async function verifyJWT(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token.replace('Bearer ', ''), secretKey);

  return payload as { sub: string };
}

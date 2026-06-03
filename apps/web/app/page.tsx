import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const roleHomePath: Record<Role, string> = {
  ADMIN: '/admin/users',
  TEACHER: '/teacher/schedule',
  STUDENT: '/student/diary',
  PARENT: '/parent/diary',
};

type AccessTokenPayload = {
  role?: string;
};

function decodeAccessTokenPayload(accessToken: string) {
  const [, payload] = accessToken.split('.');

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const decodedPayload = Buffer.from(paddedBase64, 'base64').toString(
      'utf-8',
    );

    return JSON.parse(decodedPayload) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export default async function Home() {
  const accessToken = (await cookies()).get('access_token')?.value;

  if (!accessToken) {
    redirect('/login');
  }

  const payload = decodeAccessTokenPayload(accessToken);
  const role = payload?.role as Role | undefined;

  if (!role || !roleHomePath[role]) {
    redirect('/login');
  }

  redirect(roleHomePath[role]);
}

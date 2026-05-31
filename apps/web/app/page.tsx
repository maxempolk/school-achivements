import { cookies } from 'next/headers';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const sections = [
  {
    title: 'Admin',
    description: 'Manage school data and assignments.',
    links: [
      { href: '/admin', label: 'Overview' },
      { href: '/admin/users', label: 'Users' },
      { href: '/admin/classes', label: 'Classes' },
      { href: '/admin/subjects', label: 'Subjects' },
      { href: '/admin/classrooms', label: 'Classrooms' },
      { href: '/admin/schedule', label: 'Schedule' },
      { href: '/dashboard/performance', label: 'Performance' },
    ],
  },
  {
    title: 'Teacher',
    description: 'Open lessons, schedules, grades, and attendance.',
    links: [
      { href: '/teacher/schedule', label: 'Schedule' },
      { href: '/teacher/lessons', label: 'Lessons' },
      { href: '/dashboard/performance', label: 'Performance' },
    ],
  },
  {
    title: 'Student',
    description: 'Review personal grades, attendance, and schedule.',
    links: [
      { href: '/student/grades', label: 'Grades' },
      { href: '/student/attendance', label: 'Attendance' },
      { href: '/student/schedule', label: 'Schedule' },
    ],
  },
  {
    title: 'Parent',
    description: 'Review linked child progress.',
    links: [
      { href: '/parent/grades', label: 'Grades' },
      { href: '/parent/attendance', label: 'Attendance' },
      { href: '/parent/schedule', label: 'Schedule' },
    ],
  },
] as const;

type AccessTokenPayload = {
  email?: string;
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

async function getCurrentSession() {
  const accessToken = (await cookies()).get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  return decodeAccessTokenPayload(accessToken);
}

export default async function Home() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Development navigation
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Quick links for moving between role workspaces during development.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current session</CardTitle>
            <CardDescription>
              {session?.role
                ? `Signed in as ${session.role}${session.email ? ` (${session.email})` : ''}.`
                : 'No active access token detected.'}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

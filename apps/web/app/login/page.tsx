import { LockKeyhole, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="hidden max-w-xl lg:block">
            <div className="mb-6 inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <LockKeyhole className="mr-2 size-4" />
              Secure workspace access
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight xl:text-5xl">
              Sign in to manage your workspace
            </h1>

            <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground">
              A clean and focused interface for accessing your dashboard,
              projects, and productivity tools.
            </p>
          </div>

          <Card className="w-full rounded-2xl border bg-card shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Login
              </CardTitle>
              <CardDescription>
                Enter your credentials to continue.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

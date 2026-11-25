'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { login } from '@/lib/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthLayout title="Sign In" subtitle="Enter your credentials to access the system">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          minLength={6}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
          {isPending ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-medium text-[#14233B] hover:underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
}

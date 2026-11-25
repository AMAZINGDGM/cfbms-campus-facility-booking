'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { register } from '@/lib/auth/actions';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (formData.get('password') !== formData.get('confirm_password')) {
      setError('Passwords do not match');
      return;
    }
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register to submit booking requests for campus facilities"
    >
      <Alert variant="info" className="mb-4">
        New accounts are automatically assigned the <strong>Requester</strong> role.
      </Alert>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="full_name"
          placeholder="Your full name"
          required
          autoComplete="name"
        />
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
          placeholder="Minimum 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          name="confirm_password"
          placeholder="Repeat your password"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
          {isPending ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-[#14233B] hover:underline">
          Sign in here
        </Link>
      </p>
    </AuthLayout>
  );
}

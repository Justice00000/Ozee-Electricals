import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_storefront/account/register")({
  head: () => ({ meta: [{ title: "Create Account | Ozee Electrical" }] }),
  component: CustomerRegisterPage,
});

function CustomerRegisterPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!loading && session) {
    return <Navigate to="/account" />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      void navigate({ to: "/account" });
    } else {
      setCheckEmail(true);
    }
  };

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center sm:px-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Confirm it, then sign in.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" asChild>
          <Link to="/account/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Create an account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional — you can also check out as a guest.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="brand" className="w-full rounded-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/account/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

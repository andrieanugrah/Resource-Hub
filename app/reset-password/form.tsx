"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/app/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Logo } from "@/components/logo";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
        <div className="mb-6">
          <Logo size={32} />
        </div>
        <Card className="w-full max-w-sm rounded-2xl border-0 shadow-(--shadow-card)">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 mb-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>Your password has been changed. Redirecting...</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <Link href="/login">
              <Button className="gap-1.5">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenFromUrl && !token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
        <div className="mb-6">
          <Logo size={32} />
        </div>
        <Card className="w-full max-w-sm rounded-2xl border-0 shadow-(--shadow-card)">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200 mb-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>No Reset Token</CardTitle>
            <CardDescription>Paste the token from your email below, or use the link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!token) { setError("Reset token is required."); return; }

    setLoading(true);
    try {
      const res = await apiClient("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      setLoading(false);
      if (!res.ok) { setError(d.error); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
      <div className="mb-6">
        <Logo size={32} />
      </div>
      <Card className="w-full max-w-sm rounded-2xl border-0 shadow-(--shadow-card)">
        <CardHeader className="text-center">
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your reset token and new password.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token">Reset Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

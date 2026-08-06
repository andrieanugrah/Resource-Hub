"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/app/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiClient("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      setLoading(false);
      if (!res.ok) { setError(d.error); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-sm rounded-2xl border-0 shadow-(--shadow-card)">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 mb-3">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>If an account exists for {email}, a reset link has been generated.</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-xs text-muted-foreground mb-4">
              In development mode, the reset token is printed in the server console.
              Use it at <code className="bg-muted px-1 rounded">/reset-password?token=...</code>
            </p>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm rounded-2xl border-0 shadow-(--shadow-card)">
        <CardHeader className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="inline h-3 w-3 mr-1" />Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

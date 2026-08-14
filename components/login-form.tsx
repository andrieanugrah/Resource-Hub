"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/app/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo, LogoIcon } from "@/components/logo";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiClient("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={className} {...props}>
      <Card className="overflow-hidden p-0 rounded-2xl border-0 shadow-(--shadow-card)">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <LogoIcon size={42} theme="light" className="mb-1" />
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground text-sm">
                  Login to ResourceHub
                </p>
              </div>
              {error && (
                <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
                  {error}
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden md:flex flex-col items-center justify-center p-8 bg-slate-900 text-white overflow-hidden">
            {/* Background grid */}
            <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 400 400">
              <defs>
                <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#login-grid)" />
              <circle cx="200" cy="180" r="110" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10" />
              <circle cx="200" cy="180" r="75" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10" />
              <circle cx="200" cy="180" r="40" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-500/20" />
            </svg>

            {/* Glowing ambient dots */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center z-10 space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
                <LogoIcon size={64} theme="dark" />
              </div>

              <div className="flex flex-col items-center">
                <Logo variant="wordmark" theme="dark" showSubtitle={false} />
                <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-1.5">
                  IT ASSET MANAGEMENT
                </span>
              </div>

              <div className="pt-2 text-xs text-slate-400/80 max-w-[240px] leading-relaxed">
                Centralized hardware, software license, and lifecycle inventory control.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

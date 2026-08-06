"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/app/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
          <div className="relative hidden md:block bg-linear-to-br from-primary/10 via-primary/5 to-background">
            <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 400">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/20" />
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#grid)" />
              <circle cx="200" cy="160" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/15" />
              <circle cx="200" cy="160" r="50" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/10" />
              <circle cx="200" cy="160" r="20" fill="currentColor" className="text-primary/10" />
              <rect x="60" y="260" width="280" height="12" rx="6" fill="currentColor" className="text-primary/10" />
              <rect x="100" y="285" width="200" height="8" rx="4" fill="currentColor" className="text-primary/6" />
              <rect x="130" y="305" width="140" height="8" rx="4" fill="currentColor" className="text-primary/6" />
            </svg>
            <div className="relative flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
              <span className="text-5xl font-bold tracking-tight text-primary/25">RH</span>
              <p className="mt-2 text-sm font-medium text-muted-foreground/60">ResourceHub</p>
              <p className="mt-1 text-xs text-muted-foreground/40">IT Asset Management</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

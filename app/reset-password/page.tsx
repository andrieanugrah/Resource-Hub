import { Suspense } from "react";
import { ResetPasswordForm } from "./form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-modal">
          <div className="skeleton-shimmer h-6 w-40 rounded-lg mb-4" />
          <div className="skeleton-shimmer h-4 w-56 rounded-lg mb-6" />
          <div className="space-y-4">
            <div className="skeleton-shimmer h-8 w-full rounded-lg" />
            <div className="skeleton-shimmer h-8 w-full rounded-lg" />
            <div className="skeleton-shimmer h-8 w-full rounded-lg" />
            <div className="skeleton-shimmer h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}


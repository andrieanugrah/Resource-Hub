"use client";

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)rh_csrf=([^;]*)/);
  return match?.[1] ?? "";
}

export async function apiClient(url: string, options?: RequestInit): Promise<Response> {
  const csrf = getCsrfToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options?.headers as Record<string, string> | undefined),
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
  });
}

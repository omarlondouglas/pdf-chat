"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm, SmokeyBackground } from "@/components/ui/login-form";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no login");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative w-screen h-screen bg-gray-900">
      <SmokeyBackground className="absolute inset-0" />
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </main>
  );
}

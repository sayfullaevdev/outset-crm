"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход владельца</CardTitle>
          <CardDescription>Личный CRM для товаров, заказов и публикаций в Telegram.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();

              startTransition(async () => {
                const result = await signIn("credentials", {
                  password,
                  redirect: false,
                  callbackUrl,
                });

                if (result?.error) {
                  toast.error("Неверный пароль.");
                  return;
                }

                toast.success("Вход выполнен.");

                // Full-page redirect avoids session/cookie race conditions with middleware in production.
                window.location.href = result?.url || callbackUrl;
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Входим..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

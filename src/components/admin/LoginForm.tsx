"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login, type LoginState } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const t = useTranslations("AdminLogin");
  // useActionState keeps the action's result (e.g. an error) and tells us while it is running.
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">{t("password")}</span>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </label>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl bg-red-100 px-4 py-3 font-medium text-red-900"
        >
          {t(state.error)}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

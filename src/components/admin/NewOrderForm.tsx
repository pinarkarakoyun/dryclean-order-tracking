"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createOrderAction,
  type NewOrderState,
} from "@/app/[locale]/admin/(panel)/orders/new/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { localeNames } from "@/i18n/locale-names";
import { routing } from "@/i18n/routing";
import { LIMITS } from "@/lib/order-limits";

const initialState: NewOrderState = {
  errors: {},
  values: { name: "", phone: "", language: routing.defaultLocale },
};

export function NewOrderForm() {
  const t = useTranslations("NewOrder");
  const [state, formAction, isPending] = useActionState(
    createOrderAction,
    initialState,
  );
  const { errors, values } = state;

  return (
    // noValidate: the server checks the input and shows clear, translated messages.
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-lg font-semibold">
          {t("name")}
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          autoFocus
          maxLength={LIMITS.name}
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && <FieldError id="name-error">{t(errors.name)}</FieldError>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-lg font-semibold">
          {t("phone")}
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITS.phone}
          defaultValue={values.phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "phone-error phone-hint" : "phone-hint"}
        />
        <p id="phone-hint" className="text-muted">
          {t("phoneHint")}
        </p>
        {errors.phone && <FieldError id="phone-error">{t(errors.phone)}</FieldError>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-semibold">{t("language")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {routing.locales.map((locale) => (
            <label key={locale} className="cursor-pointer">
              {/* Real radio buttons (keyboard and screen reader friendly), styled as big buttons. */}
              <input
                type="radio"
                name="language"
                value={locale}
                defaultChecked={values.language === locale}
                className="peer sr-only"
              />
              <span className="flex min-h-14 items-center justify-center rounded-xl border-2 border-border bg-surface px-2 text-center font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-4 peer-focus-visible:outline-primary">
                {localeNames[locale]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="font-medium text-red-800">
      {children}
    </p>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  renameProductAction,
  type ProductFormState,
} from "@/app/[locale]/admin/(panel)/products/actions";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LIMITS } from "@/lib/order-limits";

export function RenameProductForm({ productId, name }: { productId: string; name: string }) {
  const t = useTranslations("Products");
  const [state, formAction] = useActionState<ProductFormState, FormData>(renameProductAction, {
    error: null,
    value: name,
  });

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-lg font-semibold">
          {t("name")}
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          maxLength={LIMITS.garmentName}
          defaultValue={state.value}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "name-error" : undefined}
        />
        {state.error && (
          <p id="name-error" role="alert" className="font-medium text-red-800">
            {t(state.error)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText={t("saving")}>{t("save")}</SubmitButton>
        <ButtonLink href="/admin/products" variant="secondary">
          {t("cancel")}
        </ButtonLink>
      </div>
    </form>
  );
}

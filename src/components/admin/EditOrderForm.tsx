"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  updateOrderAction,
  type EditOrderErrorKey,
  type EditOrderState,
} from "@/app/[locale]/admin/(panel)/orders/[id]/edit/actions";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { EXPRESS_PERCENT, LIMITS } from "@/lib/order-limits";

type FormValues = NonNullable<EditOrderState["values"]>;

type EditOrderFormProps = {
  orderId: string;
  initialValues: FormValues;
};

export function EditOrderForm({ orderId, initialValues }: EditOrderFormProps) {
  const t = useTranslations("EditOrder");
  const [state, formAction] = useActionState(updateOrderAction, {
    errors: {},
    values: initialValues,
  });
  const values = state.values ?? initialValues;
  const { errors } = state;
  const errorText = (key: EditOrderErrorKey | undefined) => (key ? t(key) : undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="orderId" value={orderId} />

      {/* A big tappable checkbox. Ticked sends "on"; the server copies the surcharge onto the order. */}
      <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border-2 border-border bg-surface px-4">
        <input
          type="checkbox"
          name="express"
          defaultChecked={values.express === "on"}
          className="size-6 accent-primary"
        />
        <span className="flex flex-col">
          <span className="text-lg font-semibold">
            {t("express", { percent: EXPRESS_PERCENT })}
          </span>
          <span className="text-muted">{t("expressHint")}</span>
        </span>
      </label>

      <Field
        id="estimatedReadyDate"
        label={t("estimatedReadyDate")}
        error={errorText(errors.estimatedReadyDate)}
      >
        {/* The browser shows its own date picker (a calendar on phones). */}
        <Input
          id="estimatedReadyDate"
          name="estimatedReadyDate"
          type="date"
          defaultValue={values.estimatedReadyDate}
          className="max-w-64"
          aria-invalid={errors.estimatedReadyDate ? true : undefined}
        />
      </Field>

      <Field
        id="publicDescription"
        label={t("publicDescription")}
        hint={t("publicDescriptionHint")}
        error={errorText(errors.publicDescription)}
      >
        <Input
          id="publicDescription"
          name="publicDescription"
          maxLength={LIMITS.publicDescription}
          defaultValue={values.publicDescription}
        />
      </Field>

      <Field
        id="internalNote"
        label={t("internalNote")}
        hint={t("internalNoteHint")}
        error={errorText(errors.internalNote)}
      >
        <Textarea
          id="internalNote"
          name="internalNote"
          maxLength={LIMITS.internalNote}
          defaultValue={values.internalNote}
          className="bg-amber-50"
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton pendingText={t("saving")}>{t("save")}</SubmitButton>
        <ButtonLink href={`/admin/orders/${orderId}`} variant="secondary">
          {t("cancel")}
        </ButtonLink>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-semibold">
        {label}
      </label>
      {hint && <p className="-mt-1 text-muted">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

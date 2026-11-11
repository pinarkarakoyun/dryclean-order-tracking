"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  updateCustomerAction,
  type EditCustomerState,
} from "@/app/[locale]/admin/(panel)/customers/[id]/edit/actions";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { Link } from "@/i18n/navigation";
import type { CustomerFormErrorKey } from "@/lib/customer-validation";
import { LIMITS } from "@/lib/order-limits";

type FormValues = NonNullable<EditCustomerState["values"]>;

type EditCustomerFormProps = {
  customerId: string;
  /** Passed back to the server, which decides where to go after saving ("order:<id>" or ""). */
  from: string;
  /** Where "Vazgeç" leads: the same place a save returns to. */
  cancelHref: string;
  initialValues: FormValues;
};

export function EditCustomerForm({ customerId, from, cancelHref, initialValues }: EditCustomerFormProps) {
  const t = useTranslations("EditCustomer");
  const [state, formAction] = useActionState(updateCustomerAction, {
    errors: {},
    values: initialValues,
    phoneOwner: null,
  });
  const values = state.values ?? initialValues;
  const { errors, phoneOwner } = state;
  const errorText = (key: CustomerFormErrorKey | undefined) => (key ? t(key) : undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="from" value={from} />

      <Field id="name" label={t("name")} error={errorText(errors.name)}>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          maxLength={LIMITS.name}
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
        />
      </Field>

      <Field
        id="phone"
        label={t("phone")}
        hint={t("phoneHint")}
        error={errorText(errors.phone)}
        warning={
          phoneOwner && (
            <>
              {t("phoneTaken", { name: phoneOwner.name })}{" "}
              <Link href={`/admin/customers/${phoneOwner.id}`} className="underline">
                {t("openCustomer")}
              </Link>
            </>
          )
        }
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="off"
          maxLength={LIMITS.phone}
          defaultValue={values.phone}
          aria-invalid={errors.phone || phoneOwner ? true : undefined}
        />
      </Field>

      <Field
        id="preferenceNote"
        label={t("preferenceNote")}
        hint={t("preferenceNoteHint")}
        error={errorText(errors.preferenceNote)}
      >
        <Textarea
          id="preferenceNote"
          name="preferenceNote"
          maxLength={LIMITS.preferenceNote}
          defaultValue={values.preferenceNote}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton pendingText={t("saving")}>{t("save")}</SubmitButton>
        <ButtonLink href={cancelHref} variant="secondary">
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
  warning,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  warning?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-semibold">
        {label}
      </label>
      {hint && <p className="-mt-1 text-muted">{hint}</p>}
      {children}
      {(error || warning) && (
        <p role="alert" className="font-medium text-red-800">
          {error ?? warning}
        </p>
      )}
    </div>
  );
}

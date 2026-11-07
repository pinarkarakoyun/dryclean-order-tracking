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
import { localeNames } from "@/i18n/locale-names";
import { routing } from "@/i18n/routing";
import { LIMITS } from "@/lib/order-limits";

type FormValues = NonNullable<EditOrderState["values"]>;

type EditOrderFormProps = {
  orderId: string;
  initialValues: FormValues;
  /** Services to choose from, with names already in the current language. */
  services: { id: string; name: string }[];
};

export function EditOrderForm({ orderId, initialValues, services }: EditOrderFormProps) {
  const t = useTranslations("EditOrder");
  const tNew = useTranslations("NewOrder");
  const [state, formAction] = useActionState(updateOrderAction, {
    errors: {},
    values: initialValues,
  });
  const values = state.values ?? initialValues;
  const { errors } = state;

  // Name and phone messages are shared with the "new order" form.
  const errorText = (key: EditOrderErrorKey | undefined) => {
    if (!key) return undefined;
    switch (key) {
      case "nameRequired":
      case "nameTooLong":
      case "phoneRequired":
      case "phoneInvalid":
        return tNew(key);
      default:
        return t(key);
    }
  };

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="orderId" value={orderId} />

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-2xl font-bold">{t("customer")}</legend>

        <Field id="name" label={tNew("name")} error={errorText(errors.name)}>
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
          label={tNew("phone")}
          hint={tNew("phoneHint")}
          error={errorText(errors.phone)}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={LIMITS.phone}
            defaultValue={values.phone}
            aria-invalid={errors.phone ? true : undefined}
          />
        </Field>

        <ChoiceGroup legend={tNew("language")} columns={3}>
          {routing.locales.map((locale) => (
            <Choice
              key={locale}
              name="language"
              value={locale}
              defaultChecked={values.language === locale}
              label={localeNames[locale]}
            />
          ))}
        </ChoiceGroup>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-2xl font-bold">{t("order")}</legend>

        <ChoiceGroup legend={t("service")} columns={2} error={errorText(errors.serviceId)}>
          <Choice
            name="serviceId"
            value=""
            defaultChecked={values.serviceId === ""}
            label={t("serviceNone")}
          />
          {services.map((service) => (
            <Choice
              key={service.id}
              name="serviceId"
              value={service.id}
              defaultChecked={values.serviceId === service.id}
              label={service.name}
            />
          ))}
        </ChoiceGroup>

        <Field
          id="clothingType"
          label={t("clothingType")}
          hint={t("clothingTypeHint")}
          error={errorText(errors.clothingType)}
        >
          <Input
            id="clothingType"
            name="clothingType"
            maxLength={LIMITS.clothingType}
            defaultValue={values.clothingType}
          />
        </Field>

        <Field
          id="price"
          label={t("price")}
          hint={t("priceHint")}
          error={errorText(errors.price)}
        >
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            autoComplete="off"
            maxLength={10}
            defaultValue={values.price}
            className="max-w-48"
            aria-invalid={errors.price ? true : undefined}
          />
        </Field>

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
      </fieldset>

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

function ChoiceGroup({
  legend,
  columns,
  error,
  children,
}: {
  legend: string;
  columns: 2 | 3;
  error?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-lg font-semibold">{legend}</legend>
      <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {children}
      </div>
      {error && (
        <p role="alert" className="font-medium text-red-800">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** A radio button styled as a big tappable option. */
function Choice({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex min-h-14 items-center justify-center rounded-xl border-2 border-border bg-surface px-3 py-2 text-center font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-4 peer-focus-visible:outline-primary">
        {label}
      </span>
    </label>
  );
}

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { buttonClasses, type ButtonVariant } from "./Button";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

/** A link that looks like a big button. Internal links keep the current language. */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${buttonClasses(variant)} ${className}`} {...props} />
  );
}

type ExternalButtonLinkProps = ComponentProps<"a"> & {
  variant?: ButtonVariant;
};

/** Button-styled link to another site or app (WhatsApp, phone). */
export function ExternalButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ExternalButtonLinkProps) {
  return <a className={`${buttonClasses(variant)} ${className}`} {...props} />;
}

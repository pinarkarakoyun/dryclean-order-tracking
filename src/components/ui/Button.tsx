import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "success" | "light" | "outlineLight";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "border-2 border-primary bg-surface text-primary hover:bg-sand",
  /** Green, for the "ready, tell the customer" action. */
  success: "bg-green-700 text-white hover:bg-green-800 active:bg-green-800",
  /** For dark backgrounds (photos, footer). */
  light: "bg-background text-foreground hover:bg-sand",
  outlineLight:
    "border-2 border-background text-background hover:bg-background hover:text-foreground",
};

/**
 * Classes for a large, touch-friendly button (min. 56px high).
 * Shared by <Button> and <ButtonLink> so both always look the same.
 */
export function buttonClasses(variant: ButtonVariant = "primary"): string {
  return `inline-flex min-h-14 items-center justify-center rounded-xl px-6 py-2 text-center text-lg leading-snug font-semibold transition-colors focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${variantClasses[variant]}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant)} ${className}`}
      {...props}
    />
  );
}

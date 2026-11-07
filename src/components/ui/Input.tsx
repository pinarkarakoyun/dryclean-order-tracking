import type { ComponentProps } from "react";

/** Large text input (min. 56px high) with a clear focus ring. */
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`min-h-14 w-full rounded-xl border-2 border-border bg-surface px-4 text-lg focus:border-primary focus:outline-none ${className}`}
      {...props}
    />
  );
}

import type { ComponentProps } from "react";

/** Large multi-line text input, same style as <Input>. */
export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`min-h-28 w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-lg focus:border-primary focus:outline-none ${className}`}
      {...props}
    />
  );
}

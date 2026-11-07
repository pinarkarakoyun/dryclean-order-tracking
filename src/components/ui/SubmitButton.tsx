"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  /** Text shown while the form is being sent, e.g. "Saving…". */
  pendingText?: string;
};

/**
 * Submit button that is disabled while its form is being sent,
 * so a double tap cannot submit the same thing twice.
 */
export function SubmitButton({ pendingText, children, ...props }: SubmitButtonProps) {
  // useFormStatus reads the state of the <form> this button is inside.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

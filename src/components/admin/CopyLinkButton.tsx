"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type CopyLinkButtonProps = {
  url: string;
  label: string;
  copiedLabel: string;
};

/** Copies the tracking link, e.g. to paste it into a WhatsApp chat. */
export function CopyLinkButton({ url, label, copiedLabel }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      // Only available on HTTPS or localhost.
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for http://192.168.x.x in the shop: the older copy command.
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button variant="secondary" onClick={copy} aria-live="polite">
      {copied ? `✓ ${copiedLabel}` : label}
    </Button>
  );
}

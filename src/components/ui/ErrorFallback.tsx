"use client";

import { useTranslations } from "next-intl";
import { Button } from "./Button";

/**
 * Shown by error.tsx when a page fails (e.g. the database cannot be reached).
 * The technical message stays in the server log; staff and customers get a calm
 * Turkish text and a "try again" button instead of the framework's English crash page.
 */
export function ErrorFallback({ retry }: { retry: () => void }) {
  const t = useTranslations("ErrorPage");

  return (
    <div role="alert" className="flex flex-col gap-4 py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-lg text-muted">{t("text")}</p>
      <Button onClick={() => retry()} className="self-start">
        {t("retry")}
      </Button>
    </div>
  );
}

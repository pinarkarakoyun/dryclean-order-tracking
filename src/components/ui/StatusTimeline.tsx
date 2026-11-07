import { useFormatter, useTranslations } from "next-intl";
import type { OrderStatus } from "@/types/order";

type TimelineEntry = {
  status: OrderStatus;
  /** ISO date-time string. */
  changedAt: string;
};

/** Vertical list of status changes, oldest first. Used in admin and on the tracking page. */
export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  const t = useTranslations("Status");
  const format = useFormatter();

  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => {
        const isCurrent = index === entries.length - 1;
        return (
          <li
            key={`${entry.status}-${entry.changedAt}`}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* Line to the next entry */}
            {!isCurrent && (
              <span
                aria-hidden="true"
                className="absolute top-7 left-[11px] h-[calc(100%-1.75rem)] w-0.5 bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className={`relative mt-1 size-6 shrink-0 rounded-full border-4 ${
                isCurrent ? "border-primary bg-primary" : "border-border bg-surface"
              }`}
            />
            <div className="flex flex-col">
              <span
                className={isCurrent ? "font-bold text-primary" : "font-semibold"}
              >
                {t(entry.status)}
              </span>
              <time dateTime={entry.changedAt} className="text-muted">
                {format.dateTime(new Date(entry.changedAt), "dateTime")}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

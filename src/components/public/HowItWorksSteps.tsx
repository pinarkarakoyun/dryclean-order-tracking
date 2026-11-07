import { useTranslations } from "next-intl";

// With the order module: 4 steps, including the QR code and online tracking.
const stepsWithTracking = [
  { title: "step1Title", text: "step1Text" },
  { title: "step2Title", text: "step2Text" },
  { title: "step3Title", text: "step3Text" },
  { title: "step4Title", text: "step4Text" },
] as const;

// Without the order module: only what really happens in the shop.
const simpleSteps = [
  { title: "step1Title", text: "step1Text" },
  { title: "step2Title", text: "simpleStep2Text" },
  { title: "simpleStep3Title", text: "simpleStep3Text" },
] as const;

export function HowItWorksSteps({ withTracking }: { withTracking: boolean }) {
  const t = useTranslations("HowItWorks");
  const steps = withTracking ? stepsWithTracking : simpleSteps;

  return (
    // Columns follow the number of steps, so 3 steps fill the row like 4 do.
    <ol
      className={`grid gap-6 ${withTracking ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}
    >
      {steps.map((step, index) => (
        <li key={step.title} className="reveal flex flex-col gap-3 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <span aria-hidden="true" className="font-display text-5xl leading-none text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-xl font-semibold">{t(step.title)}</p>
          <p className="text-muted">{t(step.text)}</p>
        </li>
      ))}
    </ol>
  );
}

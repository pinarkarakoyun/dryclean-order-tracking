type SectionHeadingProps = {
  /** Small brass text above the title, e.g. "What we do". */
  eyebrow?: string;
  title: string;
  intro?: string;
  /** "h1" on pages without a photo header, otherwise "h2". */
  as?: "h1" | "h2";
  align?: "left" | "center";
  /** For dark backgrounds. */
  inverted?: boolean;
};

/** Section title in the shop's style: brass eyebrow, Vidaloka title, short line. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Heading = "h2",
  align = "left",
  inverted = false,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""}`}>
      {eyebrow && (
        <p
          className={`text-sm font-semibold tracking-[0.2em] uppercase ${
            inverted ? "text-accent" : "text-accent-strong"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        className={`text-3xl leading-tight sm:text-4xl ${inverted ? "text-background" : ""}`}
      >
        {title}
      </Heading>
      <span aria-hidden="true" className="h-0.5 w-14 bg-accent" />
      {intro && (
        <p className={`max-w-2xl text-lg ${inverted ? "text-background/85" : "text-muted"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

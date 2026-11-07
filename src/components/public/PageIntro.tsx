import { SectionHeading } from "./SectionHeading";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
};

/** Page title (h1) for pages without a photo header. */
export function PageIntro({ eyebrow, title, intro }: PageIntroProps) {
  return (
    <div className="mb-10">
      <SectionHeading as="h1" eyebrow={eyebrow} title={title} intro={intro} />
    </div>
  );
}

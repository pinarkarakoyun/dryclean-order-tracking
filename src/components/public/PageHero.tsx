import Image, { type StaticImageData } from "next/image";

type PageHeroProps = {
  image: StaticImageData;
  eyebrow?: string;
  title: string;
  intro?: string;
};

/** Photo header for sub pages (services, contact, ...). */
export function PageHero({ image, eyebrow, title, intro }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-primary">
      <Image
        src={image}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-10 object-cover opacity-45"
      />
      {/* Dark gradient so white text always stays readable on the photo. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/20" />
      <div className="animate-fade-up mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-20 pb-12 sm:pt-28 sm:pb-16">
        {eyebrow && (
          <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
        )}
        <h1 className="text-4xl text-background sm:text-5xl">{title}</h1>
        <span aria-hidden="true" className="h-0.5 w-14 bg-accent" />
        {intro && <p className="max-w-2xl text-lg text-background/90">{intro}</p>}
      </div>
    </section>
  );
}

/** Grey placeholder blocks shown while a page is loading. */
export function Skeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div aria-busy="true" className="flex animate-pulse flex-col gap-4">
      <div className="h-9 w-2/3 rounded-lg bg-border" />
      {Array.from({ length: blocks }, (_, index) => (
        <div key={index} className="h-28 rounded-xl bg-border/60" />
      ))}
    </div>
  );
}

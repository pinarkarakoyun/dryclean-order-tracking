import { socialIconPaths, type SocialNetwork } from "./social-icon-paths";

/** Brand icon (Facebook, Instagram, WhatsApp) that takes the current text color. */
export function SocialIcon({
  network,
  className = "size-6",
}: {
  network: SocialNetwork;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d={socialIconPaths[network]} />
    </svg>
  );
}

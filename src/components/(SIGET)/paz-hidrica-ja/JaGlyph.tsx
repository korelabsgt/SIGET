import { cn } from "@/lib/utils";

export function JaGlyph({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect x="4" y="4" width="56" height="56" rx="10" fill="#003882" />
      <rect x="10" y="10" width="44" height="44" rx="6" stroke="#C59B27" strokeWidth="1.6" />
      <path
        d="M20 24c6 5 18 5 24 0"
        stroke="#7eb6e8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 32c8 6 20 6 28 0"
        stroke="#d4e8f7"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20 40c6 5 18 5 24 0"
        stroke="#7eb6e8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="22" r="3.2" fill="#C59B27" />
      <path
        d="M32 18.4c3.4-3.8 8.6-1.2 7.2 3.6-1 3.4-5.2 6.2-7.2 7.6-2-1.4-6.2-4.2-7.2-7.6-1.4-4.8 3.8-7.4 7.2-3.6Z"
        fill="#1B5E20"
      />
    </svg>
  );
}

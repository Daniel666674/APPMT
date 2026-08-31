import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  color,
  className,
  size = 36,
}: {
  name: string;
  src?: string | null;
  color?: string;
  className?: string;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", className)}
      style={{ width: size, height: size, backgroundColor: color ?? "var(--brand-primary)" }}
    >
      {initials(name)}
    </div>
  );
}

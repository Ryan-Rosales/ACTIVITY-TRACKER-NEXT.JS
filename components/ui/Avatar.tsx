import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  name?: string;
  src?: string;
  className?: string;
}

export function Avatar({ name = "User", src, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const isValidSrc =
    typeof src === "string" &&
    (src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:"));

  if (isValidSrc) {
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        unoptimized={src.startsWith("data:")}
        className={cn("size-9 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full",
        "bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white",
        className,
      )}
    >
      {initials || "U"}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Область прокрутки с обычной (стандартной) полосой прокрутки.
 */
export function ScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("native-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}>
      {children}
    </div>
  );
}

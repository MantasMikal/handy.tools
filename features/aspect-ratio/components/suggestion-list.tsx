"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "../lib/ratio-math";

type Props = {
  title: string;
  items: Suggestion[];
  onSelect: (s: Suggestion) => void;
};

function tierClass(absErr: number) {
  if (absErr < 1) return "text-emerald-600 dark:text-emerald-400";
  if (absErr < 5) return "text-foreground";
  return "text-amber-600 dark:text-amber-400";
}

function formatPct(n: number) {
  if (Math.abs(n) < 0.005) return "0.00%";
  const sign = n > 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

export function SuggestionList({ title, items, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Nothing within 10%.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((s) => {
            const absErr = Math.abs(s.errorPct);
            return (
              <li key={s.ratio.display}>
                <Button
                  variant="ghost"
                  onClick={() => onSelect(s)}
                  className="w-full justify-between gap-3 h-auto px-3 py-2 font-normal"
                >
                  <span className="font-mono text-base font-semibold w-14 shrink-0 text-left">
                    {s.ratio.display}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums w-20 shrink-0 text-left",
                      tierClass(absErr)
                    )}
                  >
                    {formatPct(s.errorPct)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums ml-auto truncate">
                    → {s.snap.w}×{s.snap.h}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

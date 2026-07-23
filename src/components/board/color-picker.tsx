"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { STICKY_COLOR_CLASSES, type StickyColor } from "@/lib/types";
import { stickyColors } from "@/lib/validation";

export function ColorPicker({
  name,
  defaultValue = "yellow",
}: {
  name: string;
  defaultValue?: StickyColor;
}) {
  const [value, setValue] = useState<StickyColor>(defaultValue);

  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={value} />
      {stickyColors.map((color) => {
        const classes = STICKY_COLOR_CLASSES[color];
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => setValue(color)}
            aria-label={color}
            aria-pressed={selected}
            className={cn(
              "h-7 w-7 rounded-full transition-transform",
              classes.bg,
              selected
                ? cn(classes.ring, "scale-110 ring-2 ring-offset-2")
                : "ring-1 ring-black/10 hover:scale-105",
            )}
          />
        );
      })}
    </div>
  );
}

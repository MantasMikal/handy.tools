"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

type Props = {
  width: number;
  height: number;
  imageSrc: string | null;
  onFileDrop: (file: File) => void;
};

export function RatioCanvas({ width, height, imageSrc, onFileDrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBounds({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    noClick: !!imageSrc,
    noKeyboard: !!imageSrc,
    onDropAccepted: (files) => files[0] && onFileDrop(files[0]),
  });

  const fit = useMemo(() => {
    if (!bounds.w || !bounds.h || width <= 0 || height <= 0) {
      return { w: 0, h: 0 };
    }
    const ratio = width / height;
    const padded = { w: bounds.w - 32, h: bounds.h - 32 };
    if (padded.w / padded.h > ratio) {
      return { w: padded.h * ratio, h: padded.h };
    }
    return { w: padded.w, h: padded.w / ratio };
  }, [bounds, width, height]);

  const valid = width > 0 && height > 0;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full min-h-[300px] overflow-hidden"
    >
      {valid && fit.w > 0 && (
        <motion.div
          {...getRootProps()}
          className={cn(
            "relative rounded-md overflow-hidden flex items-center justify-center",
            !imageSrc &&
              "bg-muted/40 border-2 border-dashed border-border cursor-pointer transition-colors",
            !imageSrc && "hover:bg-accent hover:border-accent-foreground/30",
            isDragActive && "bg-accent border-accent-foreground/40"
          )}
          animate={{ width: fit.w, height: fit.h }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          style={{ width: fit.w, height: fit.h }}
        >
          <input {...getInputProps()} />
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground select-none p-2 text-center">
              <span className="font-mono text-sm">
                {width} × {height}
              </span>
              <span className="text-xs opacity-70">
                {isDragActive ? "Drop to load" : "Drop or click to load image"}
              </span>
            </div>
          )}
          {imageSrc && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-mono backdrop-blur">
              {width} × {height}
            </div>
          )}
          {imageSrc && isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground text-sm font-medium backdrop-blur-sm">
              Drop to replace
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

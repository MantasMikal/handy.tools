import AspectRatioFinder from "@/features/aspect-ratio/aspect-ratio-finder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aspect Ratio Finder",
  description:
    "Find the exact aspect ratio of any image dimensions and snap to the nearest clean or standard ratio like 16:9, 4:3, 21:9, or 3:2.",
  keywords: [
    "aspect ratio",
    "aspect ratio calculator",
    "aspect ratio finder",
    "image ratio",
    "image dimensions",
    "ratio simplifier",
    "pixel ratio",
    "gcd ratio",
    "16:9",
    "4:3",
    "21:9",
  ],
};

export default function AspectRatioPage() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <AspectRatioFinder />
    </main>
  );
}

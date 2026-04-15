"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TrashIcon } from "lucide-react";
import {
  findNearestClean,
  findNearestNamed,
  reduceRatio,
  type LockMode,
  type Suggestion,
} from "./lib/ratio-math";
import { RatioCanvas } from "./components/ratio-canvas";
import { SuggestionList } from "./components/suggestion-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AspectRatioFinder() {
  const [widthInput, setWidthInput] = useState("1920");
  const [heightInput, setHeightInput] = useState("914");
  const [candidateW, setCandidateW] = useState(1920);
  const [candidateH, setCandidateH] = useState(914);
  const [lock, setLock] = useState<LockMode>("W");
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const width = Math.max(0, Math.floor(Number(widthInput) || 0));
  const height = Math.max(0, Math.floor(Number(heightInput) || 0));
  const valid = width > 0 && height > 0;

  useEffect(() => {
    if (!imageSrc) return;
    return () => URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setWidthInput(String(img.naturalWidth));
      setHeightInput(String(img.naturalHeight));
      setCandidateW(img.naturalWidth);
      setCandidateH(img.naturalHeight);
      setImageSrc(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const handleWidthInput = (v: string) => {
    setWidthInput(v);
    const n = Math.floor(Number(v) || 0);
    if (n > 0) setCandidateW(n);
  };

  const handleHeightInput = (v: string) => {
    setHeightInput(v);
    const n = Math.floor(Number(v) || 0);
    if (n > 0) setCandidateH(n);
  };

  const reset = () => setImageSrc(null);

  const reduced = useMemo(
    () => (valid ? reduceRatio(width, height) : null),
    [width, height, valid]
  );

  const named = useMemo(
    () =>
      candidateW > 0 && candidateH > 0
        ? findNearestNamed(candidateW, candidateH, lock)
        : [],
    [candidateW, candidateH, lock]
  );

  const clean = useMemo(() => {
    if (!(candidateW > 0 && candidateH > 0)) return [];
    const exclude = named.map((s) => s.ratio.decimal);
    return findNearestClean(candidateW, candidateH, lock, exclude);
  }, [candidateW, candidateH, lock, named]);

  const handleSnap = (s: Suggestion) => {
    setWidthInput(String(s.snap.w));
    setHeightInput(String(s.snap.h));
  };

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">Aspect Ratio Finder</h1>
      <div className="grow grid items-stretch md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div className="relative flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] overflow-hidden">
          {imageSrc && (
            <Button
              size="icon"
              onClick={reset}
              className="absolute top-3 right-3 z-10"
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          )}
          <RatioCanvas
            width={width}
            height={height}
            imageSrc={imageSrc}
            onFileDrop={handleFile}
          />
        </div>

        <aside className="flex flex-col col-span-1 gap-4 h-full overflow-hidden">
          <div className="flex flex-col gap-3 border bg-card p-4 rounded-md">
            <h2 className="text-lg font-semibold">Dimensions</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="width" className="text-xs">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={widthInput}
                  onChange={(e) => handleWidthInput(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="height" className="text-xs">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={heightInput}
                  onChange={(e) => handleHeightInput(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Snap locks</Label>
              <ToggleGroup
                type="single"
                value={lock}
                onValueChange={(v) => v && setLock(v as LockMode)}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <ToggleGroupItem value="W">W</ToggleGroupItem>
                <ToggleGroupItem value="H">H</ToggleGroupItem>
                <ToggleGroupItem value="Auto">Auto</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                Which dimension stays fixed when snapping. Auto picks the larger.
              </p>
            </div>
          </div>

          {reduced && (
            <div className="flex flex-col gap-1 border bg-card p-4 rounded-md">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Exact ratio
              </h3>
              <div className="font-mono text-3xl font-bold">
                {reduced.a} : {reduced.b}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {reduced.decimal.toFixed(4)}
              </div>
            </div>
          )}

          {valid && (
            <div className="flex flex-col flex-1 min-h-0 border bg-card p-1 rounded-md overflow-hidden">
              <ScrollArea className="p-3">
                <div className="flex flex-col gap-4">
                  <SuggestionList
                    title="Nearest standards"
                    items={named}
                    onSelect={handleSnap}
                  />
                  <SuggestionList
                    title="Clean ratios (≤21)"
                    items={clean}
                    onSelect={handleSnap}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

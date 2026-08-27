"use client";

import Confetti from "react-confetti";
import Dropzone from "@/components/ui/dropzone";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GenerateIconsOptions,
  useFaviconGenerator,
} from "./hooks/use-favicon-generator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadFile } from "@/lib/download-file";
import { Checkbox } from "@/components/ui/checkbox";
import { Instructions } from "./components/instructions";
import { cn } from "@/lib/utils";
import ColorPicker from "@/components/ui/color-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionHeader } from "@radix-ui/react-accordion";

const faviconSizeOptions = [16, 32, 48, 64, 128, 256, 512];
const defaultFaviconSizes = [16, 32, 48];

export default function FaviconGenerator() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<GenerateIconsOptions>({
    faviconSizes: defaultFaviconSizes,
    themeColor: "#262626",
    backgroundColor: "#fefefe",
  });

  const {
    error,
    isGenerating,
    isLoading: isFaviconGeneratorLoading,
    isReady: isFaviconGeneratorReady,
    generateIcons,
  } = useFaviconGenerator();

  const previewUrl = useMemo(
    () => (files.length > 0 ? URL.createObjectURL(files[0]) : null),
    [files]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileAccepted = (file: File) => {
    setFiles([file]);
    setOptions((prevOptions) => ({
      ...prevOptions,
      faviconSizes: defaultFaviconSizes,
    }));
  };

  const handleFaviconSizesChange = (size: number) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      faviconSizes: prevOptions.faviconSizes.includes(size)
        ? prevOptions.faviconSizes.filter((s) => s !== size)
        : [...prevOptions.faviconSizes, size],
    }));
  };

  const handleGenerateFavicon = async () => {
    if (files.length === 0) return;
    const result = await generateIcons(files[0], options);
    if (result) {
      downloadFile(result, "icons.zip");
      setShowConfetti(true);
      setIsGenerated(true);
    }
  };

  const isDisabled = isGenerating || isFaviconGeneratorLoading;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">Favicon Generator</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div
          className={cn(
            "flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] overflow-x-auto transition-all duration-200",
            isGenerated && "md:col-span-3"
          )}
        >
          <div className="relative flex w-full items-center justify-center h-full md:overflow-hidden">
            {isGenerated && (
              <div className="w-full h-full">
                <Instructions
                  options={options}
                  isSvg={files[0].type === "image/svg+xml"}
                />
              </div>
            )}
            {!isGenerated && files.length === 0 && isFaviconGeneratorReady && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={setFiles}
                maxFiles={1}
                maxSize={1024 * 1024 * 2}
                accept={{
                  "image/jpeg": [".jpeg", ".jpg"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                  "image/svg+xml": [".svg"],
                }}
                instructions="A square PNG or SVG image. At least 512x512px size is recommended. Use SVG for optimal icon quality."
                onDropAccepted={(files) => handleFileAccepted(files[0])}
              />
            )}
            {isFaviconGeneratorLoading && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {!isGenerated && previewUrl && (
              <div className="relative w-full h-full flex bg-black rounded-md md:overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Uploaded file"
                  className="w-full h-full object-contain"
                  fill
                />
                <Button
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <AlertTitle>{error.type || "Error"}</AlertTitle>
              <AlertDescription>
                {error.message || "An unexpected error occurred"}
              </AlertDescription>
            </Alert>
          )}
        </div>
        {!isGenerated && (
          <aside className="flex flex-col col-span-1 gap-4 h-full overflow-hidden">
            <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
              <h2 className="text-xl font-semibold">Settings</h2>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">Theme Color (Optional)</h3>
                <ColorPicker
                  value={options.themeColor}
                  onChange={(color) =>
                    setOptions((prevOptions) => ({
                      ...prevOptions,
                      themeColor: color,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">
                  Background Color (Optional)
                </h3>
                <ColorPicker
                  value={options.backgroundColor}
                  onChange={(color) =>
                    setOptions((prevOptions) => ({
                      ...prevOptions,
                      backgroundColor: color,
                    }))
                  }
                />
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem
                  className="border-none"
                  value="advanced-settings"
                >
                  <AccordionTrigger className="text-lg pb-0 font-bold">
                    Advanced settings
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2 pt-2">
                      <AccordionHeader>
                        <h3 className="text-base font-bold">Favicon sizes</h3>
                      </AccordionHeader>
                      {faviconSizeOptions.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox
                            id={`faviconSize-${size}`}
                            disabled={isDisabled}
                            checked={options.faviconSizes.includes(size)}
                            onCheckedChange={() =>
                              handleFaviconSizesChange(size)
                            }
                          />
                          <label
                            htmlFor={`faviconSize-${size}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {size}x{size}px
                          </label>
                        </div>
                      ))}
                      <p className="text-sm text-gray-500">
                        The selected sizes will be embedded into the generated
                        .ico file
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="flex flex-col border bg-card p-4 rounded-md overflow-hidden">
              <ScrollArea>
                <h2 className="text-xl font-semibold pb-2">💡 Good to know</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    This generator creates a complete, modern favicon set
                    including a multi-size .ico file, PWA-ready icons (192x192,
                    512x512), a maskable icon, an Apple Touch Icon flattened
                    onto your background color, and a web manifest with your
                    theme colors. It follows the{" "}
                    <Button variant="link" asChild className="h-auto p-0">
                      <Link
                        href="https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        best practices
                      </Link>
                    </Button>{" "}
                    and avoids generating unnecessary files that are no longer
                    required.
                  </p>
                  <p className="text-sm">
                    For optimal quality, upload an SVG file. SVGs scale
                    perfectly to any size, allowing for crisp icons on
                    high-resolution displays while keeping the .ico file with a
                    small set of icon sizes for compatibility.
                  </p>
                  <p className="text-sm">
                    Icon generation happens in the browser and no data is stored
                    on the server.
                  </p>
                </div>
              </ScrollArea>
            </div>
            <AnimatePresence>
              {files && files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2 mt-auto border bg-card p-4 rounded-md"
                >
                  <Button
                    className="flex-1"
                    onClick={handleGenerateFavicon}
                    disabled={isDisabled || files.length === 0}
                  >
                    {isGenerating && (
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isGenerating ? "Working on it..." : "Generate"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        )}
        {showConfetti && (
          <Confetti
            numberOfPieces={1000}
            tweenDuration={8000}
            recycle={false}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
      </div>
    </div>
  );
}

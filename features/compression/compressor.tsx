"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import {
  ReloadIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getVideoMetadata,
  VideoMetadata,
} from "@/features/compression/lib/get-video-metadata";
import { Separator } from "@/components/ui/separator";
import {
  CompressionOptions,
  VideoSettings,
} from "@/features/compression/components/video-settings";
import { downloadFile } from "@/lib/download-file";
import { useFfmpeg } from "@/features/compression/hooks/use-ffmpeg";
import { VideoMetadataDisplay } from "./components/video-metadata-display";
import { VideoPreview } from "./components/video-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export default function Compressor() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [videoPreview, setVideoPreview] = useState<{
    original: Blob;
    compressed: Blob;
  } | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );
  const debouncePreviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cOptions, setCOptions] = useState<CompressionOptions>({
    quality: 65,
    preset: "superfast",
    fps: 30,
    scale: 1,
    removeAudio: false,
    generatePreview: true,
    previewDuration: 3,
  });

  const {
    error,
    isLoaded: isFfmpegLoaded,
    isLoading: isFfmpegLoading,
    isTranscoding,
    isGeneratingPreview,
    generateVideoPreview,
    progress,
    transcode,
  } = useFfmpeg();

  const handleTranscode = async () => {
    if (!isFfmpegLoaded) {
      console.error("FFmpeg not loaded");
      return;
    }

    const file = files[0];
    if (!file) {
      console.error("No file to transcode");
      return;
    }

    const result = await transcode(file, cOptions);
    if (!result) return;
    setShowConfetti(true);
    const { file: output, name } = result;
    downloadFile(output, name);
  };

  const handleFileAccepted = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];

    if (file) {
      setVideoUploading(true);
      await Promise.all([
        getVideoMetadata(file).then((metadata) => setVideoMetadata(metadata)),
        handleGeneratePreview(file, cOptions),
      ]);

      setVideoUploading(false);
    }
  };

  const handleGeneratePreview = async (
    file: File,
    options: CompressionOptions
  ) => {
    if (!isFfmpegLoaded) return;
    try {
      const result = await generateVideoPreview(file, options);
      if (!result) return;
      const { original, compressed, estimatedSize: size } = result;
      setEstimatedSize(size);
      setVideoPreview({ original, compressed });
    } catch (error) {
      console.error("Error estimating output size:", error);
    }
  };

  const debouncedGeneratePreview = (options: CompressionOptions) => {
    if (files.length > 0) {
      if (debouncePreviewTimerRef.current) {
        clearTimeout(debouncePreviewTimerRef.current);
      }

      debouncePreviewTimerRef.current = setTimeout(async () => {
        await handleGeneratePreview(files[0], options);
      }, 300);
    }
  };

  const handleOptionsChange = (options: CompressionOptions) => {
    setCOptions(options);
    if (!options.generatePreview) return;
    debouncedGeneratePreview(options);
  };

  const isDisabled = !isFfmpegLoaded || isTranscoding;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full overflow-hidden">
      <h1 className="text-2xl font-bold">Video Compressor</h1>
      <div className="grow grid items-start md:grid-cols-[1fr_290px] gap-4 w-full h-full mx-auto overflow-hidden">
        <div className="relative flex flex-col gap-2 border p-2 rounded-md bg-card h-full min-h-[300px] max-h-[847px]">
          <div className="relative flex items-center justify-center h-full">
            {files.length === 0 && !isFfmpegLoading && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={setFiles}
                onDropAccepted={handleFileAccepted}
                disabled={isDisabled}
                maxFiles={1}
                maxSize={1024 * 1024 * 1024 * 2}
                accept={{
                  "video/mp4": [".mp4"],
                  "video/mpeg": [".mpeg"],
                  "video/webm": [".webm"],
                  "video/quicktime": [".mov"],
                  "video/3gpp": [".3gp"],
                  "video/x-msvideo": [".avi"],
                  "video/x-flv": [".flv"],
                  "video/x-matroska": [".mkv"],
                  "video/ogg": [".ogg"],
                  "video/avi": [".avi"],
                }}
              />
            )}
            {(videoUploading || isFfmpegLoading) && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {files.length > 0 && videoPreview && !videoUploading && (
              <div className="relative w-full h-full flex bg-black rounded-md overflow-hidden">
                <VideoPreview videoPreview={videoPreview} />
                <Button
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
                {!videoPreview && isGeneratingPreview && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Spinner className="border-white" />
                  </div>
                )}
                {videoPreview && isGeneratingPreview && (
                  <AnimatePresence>
                    <motion.div
                      className="absolute bottom-1 left-1 backdrop-blur p-1 px-2 rounded-md bg-black bg-opacity-50 flex items-center gap-2"
                      initial={{ opacity: 0, transform: "translateY(10%)" }}
                      animate={{ opacity: 1, transform: "translateY(0%)" }}
                      exit={{ opacity: 0, transform: "translateY(10%)" }}
                    >
                      <Spinner className="border-white w-4 h-4 border-2" />
                      <span className="text-sm text-white">
                        Generating preview
                      </span>
                    </motion.div>
                  </AnimatePresence>
                )}
                {isTranscoding && (
                  <Progress
                    className="absolute w-full bottom-0"
                    value={progress * 100}
                  />
                )}
              </div>
            )}
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                className="absolute bottom-0 left-0 p-3 w-full z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <Alert className="bg-black" variant="destructive">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <AlertTitle>{error.type || "Error"}</AlertTitle>
                  <AlertDescription>
                    {error.message || "An unexpected error occurred"}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className="flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex flex-col border p-1 bg-card rounded-md overflow-hidden">
            <ScrollArea className="p-2">
              <div className="flex p-1 flex-col gap-2 grow">
                <h2 className="text-xl font-semibold">Settings</h2>
                <VideoSettings
                  isDisabled={isDisabled}
                  cOptions={cOptions}
                  onOptionsChange={handleOptionsChange}
                />
              </div>
            </ScrollArea>
          </div>
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2 border bg-card p-4 rounded-md"
              >
                <h2 className="text-xl font-semibold">Details</h2>
                {videoMetadata && (
                  <VideoMetadataDisplay
                    videoMetadata={videoMetadata}
                    cOptions={cOptions}
                    estimatedSize={estimatedSize}
                  />
                )}
                <Separator />
                <div className="flex w-full justify-evenly flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleTranscode}
                    disabled={
                      isDisabled || files.length === 0 || isGeneratingPreview
                    }
                  >
                    {isTranscoding && (
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isTranscoding ? "Compressing" : "Compress"}
                  </Button>
                  {!cOptions.generatePreview && (
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => handleGeneratePreview(files[0], cOptions)}
                      disabled={isDisabled || isGeneratingPreview}
                    >
                      {isGeneratingPreview && (
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isGeneratingPreview ? "Processing" : "Generate Preview"}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {files.length === 0 && (
            <div className="flex flex-col border bg-card p-1 rounded-md md:min-h-[150px] overflow-hidden">
              <ScrollArea className="p-3">
                <h2 className="text-xl font-semibold pb-2">💡 Good to know</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    The compression runs entirely in your browser. No data is
                    stored on the server. Because of this, there are some
                    limitations of speed and file size.
                  </p>
                  <p className="text-sm">
                    Huge props to the{" "}
                    <Button variant="link" asChild className="h-auto p-0">
                      <Link
                        href="https://github.com/ffmpegwasm/ffmpeg.wasm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ffmpeg.wasm
                      </Link>
                    </Button>{" "}
                    devs for making this possible.
                  </p>
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>
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

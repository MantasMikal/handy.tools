"use client";

import { getRandomId } from "@/lib/get-random-id";
import {
  getVideoMetadata,
  VideoMetadata,
} from "@/features/compression/lib/get-video-metadata";
import { qualityToCrf } from "@/features/compression/lib/quality-to-crf";
import { FFmpeg, FFFSType } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export type PresetOptions =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow"
  | "slower"
  | "veryslow";

export type TranscodeOptions = {
  quality?: number;
  scale?: number;
  preset?: PresetOptions;
  fps?: number;
  removeAudio?: boolean;
  previewDuration?: number;
};

export type TranscodeOutput = {
  file: Blob;
  name: string;
};

export type ThumbnailOutput = {
  thumbnail: Blob;
};

export type PreviewOutput = {
  original: Blob;
  compressed: Blob;
  estimatedSize: number;
};

const DEFAULT_PREVIEW_DURATION = 3;
const DEFAULT_QUALITY = 100;
const DEFAULT_SCALE = 1;
const DEFAULT_REMOVE_AUDIO = false;
const DEFAULT_FPS = 30;
const DEFAULT_PRESET: PresetOptions = "superfast";
const INPUT_DIR = "/input";
const TIMEOUT = -1;

const DECODE_HEAP_BUDGET = 128 * 1024 * 1024;
const DECODE_BYTES_PER_PIXEL_PER_THREAD = 4;

const decodeArgs = (metadata: VideoMetadata | null): string[] => {
  const cores = navigator.hardwareConcurrency || 4;
  const pixels = metadata ? metadata.width * metadata.height : 0;
  if (!pixels) return ["-threads", String(Math.min(cores, 4))];
  const bytesPerThread = pixels * DECODE_BYTES_PER_PIXEL_PER_THREAD;
  const threads = Math.min(
    cores,
    Math.max(1, Math.round(DECODE_HEAP_BUDGET / bytesPerThread))
  );
  return ["-threads", String(threads)];
};

const tryGetVideoMetadata = (file: File): Promise<VideoMetadata | null> =>
  getVideoMetadata(file).catch(() => null);

const AUDIO_COPY_UNSUPPORTED_LOG = "codec not currently supported in container";
const LOG_TAIL_SIZE = 20;

const swapAudioCopyForAac = (args: string[]): string[] | null => {
  const out = [...args];
  const allIdx = out.findIndex((a, i) => a === "-c" && out[i + 1] === "copy");
  if (allIdx !== -1) {
    out.splice(allIdx, 2, "-c:v", "copy", "-c:a", "aac");
    return out;
  }
  const audioIdx = out.findIndex((a, i) => a === "-c:a" && out[i + 1] === "copy");
  if (audioIdx !== -1) {
    out.splice(audioIdx + 1, 1, "aac");
    return out;
  }
  return null;
};

/**
 * Sanitizes a filename by replacing non-alphanumeric characters with underscores
 * and converting to lowercase
 * @param name - The original filename
 * @returns The sanitized filename
 */
const sanitizeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

export class FFmpegService {
  public ffmpeg: FFmpeg;
  private abortController: AbortController | null = null;
  private logTail: string[] = [];

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on("log", ({ message }) => {
      this.logTail.push(message);
      if (this.logTail.length > LOG_TAIL_SIZE) this.logTail.shift();
    });
  }

  /**
   * Runs an FFmpeg command. When stream-copied audio is rejected by the
   * output container (the wasm build's mp4 muxer cannot store PCM), retries
   * once with the audio re-encoded to AAC.
   * @param args - FFmpeg command arguments
   * @param signal - AbortSignal for cancellation
   * @returns Promise resolving to the FFmpeg exit code
   */
  private async exec(args: string[], signal: AbortSignal): Promise<number> {
    this.logTail = [];
    const result = await this.ffmpeg.exec(args, TIMEOUT, { signal });
    if (result === 0) return result;

    const audioCopyRejected = this.logTail.some((line) =>
      line.includes(AUDIO_COPY_UNSUPPORTED_LOG)
    );
    const fallbackArgs = audioCopyRejected ? swapAudioCopyForAac(args) : null;
    if (!fallbackArgs) return result;

    this.logTail = [];
    return this.ffmpeg.exec(fallbackArgs, TIMEOUT, { signal });
  }

  /**
   * Loads the FFmpeg core, WebAssembly, and worker files
   * @param baseURL - Base URL for loading FFmpeg assets
   */
  async load(baseURL = ""): Promise<void> {
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
  }

  /**
   * Converts transcode options into FFmpeg command line arguments
   * @param options - Transcoding options including codec, quality, scale, etc.
   * @returns Array of FFmpeg command arguments
   */
  transcodeOptionsToArgs(options: TranscodeOptions) {
    const {
      quality = DEFAULT_QUALITY,
      scale = DEFAULT_SCALE,
      fps = DEFAULT_FPS,
      removeAudio = DEFAULT_REMOVE_AUDIO,
      preset = DEFAULT_PRESET,
    } = options;

    const args = ["-threads", "2"];

    if (removeAudio) {
      args.push("-an");
    } else {
      args.push("-c:a", "copy");
    }

    args.push(
      "-c:v",
      "libx264",
      // Force 8-bit 4:2:0; browsers cannot play 4:2:2 or 10-bit h264
      "-pix_fmt",
      "yuv420p",
      "-crf",
      qualityToCrf(quality).toString(),
      "-preset",
      preset,
      // moov atom up front so browsers can start playback while streaming
      "-movflags",
      "+faststart"
    );

    if (scale && scale < 1) {
      const scaledWidth = `round(iw*${scale}/2)*2`;
      args.push("-vf", `scale=${scaledWidth}:-2`);
    }

    if (fps) {
      args.push("-r", `${fps}`);
    }

    console.log(`FFMPEG ARGS: ${args}`);

    return args;
  }

  /**
   * Transcodes a video file using specified options
   * @param file - Input video file
   * @param options - Transcoding options
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing the transcoded file and filename
   */
  async transcode(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<TranscodeOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;
    const metadata = await tryGetVideoMetadata(file);
    const sanitizedInputFileName = sanitizeFileName(file.name);
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;
    const outputFileName = `${sanitizedInputFileName
      .split(".")
      .slice(0, -1)
      .join(".")}-compressed-${getRandomId()}.mp4`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const result = await this.exec(
      [
        ...decodeArgs(metadata),
        "-i",
        `${inputDir}/${file.name}`,
        ...args,
        outputFileName,
      ],
      abortSignal
    );

    if (result !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Video compression error");
    }

    const fileData = await this.ffmpeg.readFile(outputFileName);
    const data = new Uint8Array(fileData as unknown as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      file: new Blob([data.buffer], { type: "video/mp4" }),
      name: outputFileName,
    };
  }

  /**
   * Extracts a thumbnail from a video file
   * @param file - Input video file
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing the thumbnail (WebP)
   */
  async extractThumbnail(
    file: File,
    signal?: AbortSignal
  ): Promise<ThumbnailOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const outputImageFileName = `thumb-${getRandomId()}.webp`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const thumbResult = await this.ffmpeg.exec(
      [
        "-threads",
        "1",
        "-i",
        `${inputDir}/${file.name}`,
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-update",
        "1",
        "-c:v",
        "libwebp",
        "-preset",
        "picture",
        outputImageFileName,
      ],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (thumbResult !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Thumbnail extraction error");
    }

    const fileData = await this.ffmpeg.readFile(outputImageFileName);
    const data = new Uint8Array(fileData as unknown as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputImageFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      thumbnail: new Blob([data.buffer], { type: "image/webp" }),
    };
  }

  /**
   * Generates a preview of the video compression by processing a short segment
   * @param file - Input video file
   * @param options - Transcoding options
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing original and compressed previews, and estimated final size
   */
  async generatePreview(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<PreviewOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const metadata = await tryGetVideoMetadata(file);

    const previewDuration = options.previewDuration || DEFAULT_PREVIEW_DURATION;
    const sampleDuration = metadata
      ? Math.min(previewDuration, metadata.duration)
      : previewDuration;
    const sampleOutputFileName = `sample_output-${getRandomId()}.mp4`;
    const originalOutputFileName = `original_output-${getRandomId()}.mp4`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const result = [
      await this.exec(
        [
          "-ss",
          "0",
          "-i",
          `${inputDir}/${file.name}`,
          "-t",
          sampleDuration.toString(),
          "-c",
          "copy",
          originalOutputFileName,
        ],
        abortSignal
      ),
      await this.exec(
        [
          ...decodeArgs(metadata),
          "-ss",
          "0",
          "-i",
          `${inputDir}/${file.name}`,
          "-t",
          sampleDuration.toString(),
          ...args,
          sampleOutputFileName,
        ],
        abortSignal
      ),
    ];

    if (result.some((r) => r !== 0)) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Error encoding sample segment");
    }

    const sampleOutputData = await this.ffmpeg.readFile(sampleOutputFileName);
    const originalOutputData = await this.ffmpeg.readFile(
      originalOutputFileName
    );
    const sampleOutputSize = (sampleOutputData as Uint8Array).length;
    const originalOutputSize = (originalOutputData as Uint8Array).length;

    const compressionRatio = sampleOutputSize / originalOutputSize;
    const estimatedSizeMB = (file.size / 1024 / 1024) * compressionRatio;

    // Clean up
    await this.ffmpeg.deleteFile(sampleOutputFileName);
    await this.ffmpeg.deleteFile(originalOutputFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      original: new Blob([originalOutputData], {
        type: "video/mp4",
      }),
      compressed: new Blob([sampleOutputData], {
        type: "video/mp4",
      }),
      estimatedSize: Math.round(estimatedSizeMB * 100) / 100, // Round to 2 decimal places,
    };
  }

  /**
   * Terminates the FFmpeg instance
   */
  terminate(): void {
    this.ffmpeg.terminate();
  }

  /**
   * Aborts any ongoing FFmpeg operations
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

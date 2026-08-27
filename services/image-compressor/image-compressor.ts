import * as avif from "@jsquash/avif";
import * as jpeg from "@jsquash/jpeg";
import * as jxl from "@jsquash/jxl";
import * as png from "@jsquash/png";
import * as webp from "@jsquash/webp";
import * as pngOptimiser from "@jsquash/oxipng";

export type ImageCompressorOutputType =
  | "avif"
  | "jpeg"
  | "jxl"
  | "png"
  | "webp";

export type AvifEncodeOptions = {
  outputType: "avif";
  quality: number;
  sharpness: number;
};

export type JpegEncodeOptions = {
  outputType: "jpeg" | "jpg";
  quality: number;
};

export type JxlEncodeOptions = {
  outputType: "jxl";
  quality: number;
};

export type PngEncodeOptions = {
  outputType: "png";
  level: number;
};

export type WebpEncodeOptions = {
  outputType: "webp";
  quality: number;
};

export const getDefaultsForOutputType = (
  outputType: ImageCompressorOutputType
): ImageCompressorOptions => {
  switch (outputType) {
    case "avif":
      return {
        outputType: "avif",
        quality: 75,
        sharpness: 100,
      };
    case "jpeg":
      return {
        outputType: "jpeg",
        quality: 75,
      };
    case "jxl":
      return {
        outputType: "jxl",
        quality: 75,
      };
    case "png":
      return {
        outputType: "png",
        level: 3,
      };
    case "webp":
      return {
        outputType: "webp",
        quality: 75,
      };
    default:
      throw new Error(`Unknown output type: ${outputType}`);
  }
};

export type ImageCompressorOptions =
  | AvifEncodeOptions
  | JpegEncodeOptions
  | JxlEncodeOptions
  | PngEncodeOptions
  | WebpEncodeOptions;

export type ImageCompressorInput = {
  name: string;
  type: string;
  arrayBuffer: ArrayBuffer;
};

class ImageCompressor {
  public async compressImage(image: ImageCompressorInput, options: ImageCompressorOptions) {
    try {
      const sourceType = image.name.endsWith("jxl")
        ? "jxl"
        : image.type.replace("image/", "");
      const imageData = await this.decode(sourceType, image.arrayBuffer);
      if (!imageData) {
        throw new Error(`Failed to decode image of type "${sourceType}"`);
      }
      const compressedImage = await this.encode(imageData, options);
      const imageBlob = new Blob([compressedImage], {
        type: `image/${options.outputType}`,
      });
      return imageBlob;
    } catch (error) {
      throw new Error(`Failed to compress image: ${error}`);
    }
  }

  public async decode(sourceType: string, fileBuffer: ArrayBuffer) {
    switch (sourceType) {
      case "avif":
        return await avif.decode(fileBuffer);
      case "jpeg":
        return await jpeg.decode(fileBuffer);
      case "jxl":
        return await jxl.decode(fileBuffer);
      case "png":
        return await png.decode(fileBuffer);
      case "webp":
        return await webp.decode(fileBuffer);
      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }
  }

  public async encode(imageData: ImageData, options: ImageCompressorOptions) {
    switch (options.outputType) {
      case "avif":
        return await avif.encode(imageData, options);
      case "jpeg":
        return await jpeg.encode(imageData, options);
      case "jxl":
        return await jxl.encode(imageData, options);
      case "png":
        return await pngOptimiser.optimise(imageData, {
          ...options,
          level: 7 - options.level, // Reverse the level because the slider is inverted
        });
      case "webp":
        return await webp.encode(imageData, options);
      default:
        throw new Error(`Unknown output type: ${options.outputType}`);
    }
  }
}

export default ImageCompressor;

import {
  renderSvgToPng,
  SvgRenderOptions,
} from "@/features/favicon-generator/lib/render-svg-to-png";
import {
  initializeImageMagick,
  ImageMagick,
  MagickImageCollection,
  MagickFormat,
  MagickColor,
  MagickColors,
  MagickGeometry,
  Gravity,
  AlphaOption,
} from "@imagemagick/magick-wasm";

export type IconRenderOptions = SvgRenderOptions;

export class MagickService {
  private initialized: boolean = false;

  /**
   * Initializes the ImageMagick WASM module.
   * This must be called before using any other methods in this service.
   * @returns Promise that resolves when initialization is complete
   */
  public async initMagick(): Promise<void> {
    if (!this.initialized) {
      // @ts-expect-error - Load WASM
      const magickWasm = await import("@imagemagick/magick-wasm/magick.wasm");
      const magickBuffer = await fetch(magickWasm.default).then((res) =>
        res.arrayBuffer()
      );
      await initializeImageMagick(magickBuffer);
      this.initialized = true;
    }
  }

  /**
   * Generates a square PNG icon of the specified size from the input file.
   * The source keeps its aspect ratio and is centered on a square canvas,
   * optionally scaled down and placed on a background color.
   * @param file - The source image file to process
   * @param size - The width and height of the output image in pixels
   * @param options - Content scale and background color
   * @returns Promise that resolves with a PNG Blob
   * @throws Error if ImageMagick is not initialized
   */
  public async generateIcon(
    file: File,
    size: number,
    options: IconRenderOptions = {}
  ): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    if (file.type === "image/svg+xml") {
      return renderSvgToPng(file, size, options);
    }

    const { contentScale = 1, background } = options;
    const imageData = new Uint8Array(await file.arrayBuffer());

    return new Promise((resolve, reject) => {
      try {
        ImageMagick.read(imageData, (image) => {
          const contentSize = Math.round(size * contentScale);
          image.resize(contentSize, contentSize);
          image.alpha(AlphaOption.Set);
          image.extent(
            new MagickGeometry(size, size),
            Gravity.Center,
            background ? new MagickColor(background) : MagickColors.Transparent
          );
          image.write(MagickFormat.Png, (data) => {
            resolve(new Blob([data], { type: "image/png" }));
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates a multi-size ICO favicon file from the input image.
   * Each entry is padded to a transparent square so non-square sources
   * produce valid square icons.
   * @param file - The source image file to process
   * @param sizes - Array of sizes in pixels for the favicon
   * @returns Promise that resolves with an ICO Blob containing all specified sizes
   * @throws Error if ImageMagick is not initialized
   */
  public async generateFavicon(
    file: File,
    sizes: number[] = [16, 32, 48]
  ): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    let imageBlob: Blob = file;
    if (file.type === "image/svg+xml") {
      const largestSize = Math.max(...sizes);
      imageBlob = await renderSvgToPng(file, largestSize);
    }

    const imageData = new Uint8Array(await imageBlob.arrayBuffer());

    return new Promise((resolve, reject) => {
      try {
        ImageMagick.read(imageData, (image) => {
          const images = MagickImageCollection.create();

          const cloneAndResize = (index: number) => {
            if (index >= sizes.length) {
              images.write(MagickFormat.Ico, (data) => {
                resolve(new Blob([data], { type: "image/x-icon" }));
              });
              return;
            }
            image.clone((img) => {
              const size = sizes[index];
              img.resize(size, size);
              img.alpha(AlphaOption.Set);
              img.extent(
                new MagickGeometry(size, size),
                Gravity.Center,
                MagickColors.Transparent
              );
              images.push(img);
              cloneAndResize(index + 1);
            });
          };

          cloneAndResize(0);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Checks if the ImageMagick service has been initialized.
   * @returns boolean indicating whether the service is ready to use
   */
  public isReady(): boolean {
    return this.initialized;
  }
}

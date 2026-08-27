export type SvgRenderOptions = {
  /** Fraction of the output size the artwork is scaled to fit within (1 = full bleed) */
  contentScale?: number;
  /** Fill color behind the artwork; transparent when omitted */
  background?: string;
};

/**
 * Renders an SVG file to a square PNG of the given size. The artwork keeps
 * its aspect ratio and is centered, optionally scaled down and placed on a
 * background color.
 */
export const renderSvgToPng = async (
  svgFile: File,
  size: number,
  options: SvgRenderOptions = {}
): Promise<Blob> => {
  const { contentScale = 1, background } = options;

  const svgUrl = URL.createObjectURL(await withExplicitDimensions(svgFile));
  try {
    const img = await loadImage(svgUrl);
    if (!img.width || !img.height) {
      throw new Error(
        "The SVG has no intrinsic size. Add width/height or a viewBox to the root <svg> element."
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context.");
    }

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
    }

    const box = size * contentScale;
    const scale = Math.min(box / img.width, box / img.height);
    const width = img.width * scale;
    const height = img.height * scale;
    ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height);

    return await canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

/**
 * SVGs with only a viewBox render blank on canvas in some engines; give the
 * root element explicit dimensions when they are missing.
 */
const withExplicitDimensions = async (svgFile: File): Promise<Blob> => {
  const text = await svgFile.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;

  if (svg.tagName !== "svg") {
    return svgFile;
  }

  if (!svg.hasAttribute("width") || !svg.hasAttribute("height")) {
    const viewBox = svg
      .getAttribute("viewBox")
      ?.split(/[\s,]+/)
      .map(Number);
    if (viewBox?.length === 4) {
      svg.setAttribute("width", String(viewBox[2]));
      svg.setAttribute("height", String(viewBox[3]));
    }
  }

  return new Blob([new XMLSerializer().serializeToString(doc)], {
    type: "image/svg+xml",
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load the SVG as an image."));
    img.src = src;
  });

const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to PNG."));
      }
    }, "image/png");
  });

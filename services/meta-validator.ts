import * as cheerio from "cheerio";
import fetchHtml from "@/lib/fetch-html";
import fetchImage from "@/lib/fetch-image";

interface MetaTag {
  tag: string;
  attributes: { [key: string]: string };
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
}

interface Manifest {
  name?: string;
  short_name?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
  start_url?: string;
  display?: string;
  [key: string]: unknown; // For any additional fields
}

interface CheckResult {
  errors: string[];
  successes: string[];
}

interface ValidationRule<T> {
  title: string;
  description: string;
  check: (data: T, baseUrl: string) => Promise<CheckResult>;
}

export interface RuleValidationResult {
  title: string;
  description: string;
  errors: string[];
  successes: string[];
}

export interface ValidationResult {
  metaTags: RuleValidationResult[];
  manifest: RuleValidationResult[] | null;
}

class MetaValidatorService {
  private metaTagRules: ValidationRule<MetaTag[]>[];
  private manifestRules: ValidationRule<Manifest>[];

  constructor() {
    this.metaTagRules = [
      {
        title: "Page Title",
        description: "Checks if the page has a title tag",
        check: async (data: MetaTag[]) => {
          if (data.some((tag) => tag.tag === "title")) {
            return { errors: [], successes: ["Page title is present"] };
          } else {
            return { errors: ["Page title is missing"], successes: [] };
          }
        },
      },
      {
        title: "Meta Description",
        description: "Checks if the page has a meta description",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.name === "description"
            )
          ) {
            return { errors: [], successes: ["Meta description is present"] };
          } else {
            return { errors: ["Meta description is missing"], successes: [] };
          }
        },
      },
      {
        title: "Language Meta Tag",
        description: "Checks if the page has a language meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "html" && tag.attributes.lang?.length > 0
            )
          ) {
            return { errors: [], successes: ["Language meta tag is present"] };
          } else {
            return { errors: ["Language meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Viewport Meta Tag",
        description: "Checks if the page has a viewport meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.name === "viewport"
            )
          ) {
            return { errors: [], successes: ["Viewport meta tag is present"] };
          } else {
            return { errors: ["Viewport meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Charset Meta Tag",
        description: "Checks if the page has a charset meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.charset === "utf-8"
            )
          ) {
            return { errors: [], successes: ["Charset meta tag is present"] };
          } else {
            return { errors: ["Charset meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Robots Meta Tag",
        description: "Checks if the page has a robots meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.name === "robots"
            )
          ) {
            return { errors: [], successes: ["Robots meta tag is present"] };
          } else {
            return { errors: ["Robots meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Theme Color Meta Tag",
        description: "Checks if the page has a theme color meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.name === "theme-color"
            )
          ) {
            return {
              errors: [],
              successes: ["Theme color meta tag is present"],
            };
          } else {
            return {
              errors: ["Theme color meta tag is missing"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Open Graph Title",
        description: "Checks if the page has an Open Graph title meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.property === "og:title"
            )
          ) {
            return { errors: [], successes: ["Open Graph title is present"] };
          } else {
            return { errors: ["Open Graph title is missing"], successes: [] };
          }
        },
      },
      {
        title: "Open Graph Description",
        description:
          "Checks if the page has an Open Graph description meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" &&
                tag.attributes.property === "og:description"
            )
          ) {
            return {
              errors: [],
              successes: ["Open Graph description is present"],
            };
          } else {
            return {
              errors: ["Open Graph description is missing"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Open Graph Image",
        description: "Checks if the page has an Open Graph image meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.property === "og:image"
            )
          ) {
            return { errors: [], successes: ["Open Graph image is present"] };
          } else {
            return { errors: ["Open Graph image is missing"], successes: [] };
          }
        },
      },
      {
        title: "ICO Favicon",
        description:
          "Checks if has a an .ICO favicon which is required for compatibility with older browsers.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };

          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes?.href?.endsWith(".ico")
          );

          if (!iconTag) {
            result.errors.push("ICO Favicon is missing");
            return result;
          }

          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = "image/x-icon";
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Favicon",
        description:
          "Checks if the page has a favicon with a valid MIME type and size.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };

          const icoIcon = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes.type === "image/x-icon"
          );

          const svgIcon = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes.type === "image/svg+xml"
          );

          const pngIcon = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes.type === "image/png"
          );

          const jpegIcon = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes.type === "image/jpeg"
          );

          if (!icoIcon && !svgIcon && !pngIcon && !jpegIcon) {
            result.errors.push("Favicon is missing");
            return result;
          }

          if (svgIcon) {
            const href = this.resolveUrl(baseUrl, svgIcon.attributes.href);
            const expectedType = "image/svg+xml";
            const iconValidationResult = await this.validateIcon(
              href,
              expectedType
            );

            result.errors.push(...iconValidationResult.errors);
            result.successes.push(...iconValidationResult.successes);

            if (!icoIcon) {
              result.successes.push(
                "But it doesn't have an .ico icon. It's recommended to have an .ico icon for compatibility with older browsers."
              );
            }

            result.successes.push("Has a SVG favicon");

            return result;
          }

          if (pngIcon) {
            const href = this.resolveUrl(baseUrl, pngIcon.attributes.href);
            const expectedType = "image/png";
            const iconValidationResult = await this.validateIcon(
              href,
              expectedType,
              16,
              256
            );

            result.errors.push(...iconValidationResult.errors);
            result.successes.push(...iconValidationResult.successes);
            result.successes.push("Has a PNG favicon");

            return result;
          }

          if (jpegIcon) {
            const href = this.resolveUrl(baseUrl, jpegIcon.attributes.href);
            const expectedType = "image/jpeg";
            const iconValidationResult = await this.validateIcon(
              href,
              expectedType,
              16,
              256
            );

            result.errors.push(...iconValidationResult.errors);
            result.successes.push(...iconValidationResult.successes);
            result.errors.push(
              "JPEG favicon is not recommended. But if it looks good, it's fine."
            );
            result.successes.push("Has a JPEG favicon");
            return result;
          }

          return result;
        },
      },
      {
        title: "Apple Touch Icon",
        description:
          "Checks if the page has an Apple Touch Icon which is used when iOS users add your website to their home screen.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };
          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "apple-touch-icon" &&
              tag.attributes.href
          );
          if (!iconTag) {
            result.errors.push("Apple Touch Icon is missing");
            return result;
          }
          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = "image/png";
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType,
            180,
            180
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Web App Manifest",
        description: "Checks if the page has a web app manifest",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "link" && tag.attributes.rel === "manifest"
            )
          ) {
            return { errors: [], successes: ["Web App Manifest is present"] };
          } else {
            return { errors: ["Web App Manifest is missing"], successes: [] };
          }
        },
      },
    ];

    this.manifestRules = [
      {
        title: "Name",
        description: "Checks if the manifest has a 'name' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.name === "string") {
            return { errors: [], successes: ["Manifest 'name' is present"] };
          } else {
            return {
              errors: ["Manifest 'name' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Short Name",
        description: "Checks if the manifest has a 'short_name' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.short_name === "string") {
            return {
              errors: [],
              successes: ["Manifest 'short_name' is present"],
            };
          } else {
            return {
              errors: ["Manifest 'short_name' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Theme Color",
        description: "Checks if the manifest has a 'theme_color' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.theme_color === "string") {
            return {
              errors: [],
              successes: ["Manifest 'theme_color' is present"],
            };
          } else {
            return {
              errors: ["Manifest 'theme_color' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Background Color",
        description: "Checks if the manifest has a 'background_color' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.background_color === "string") {
            return {
              errors: [],
              successes: ["Manifest 'background_color' is present"],
            };
          } else {
            return {
              errors: [
                "Manifest 'background_color' is missing or not a string",
              ],
              successes: [],
            };
          }
        },
      },
      {
        title: "192x192 PNG Icon",
        description:
          "Checks if the manifest has a 192x192 PNG icon for Android",
        check: async (manifest: Manifest, baseUrl: string) => {
          const icon = manifest.icons?.find(
            (icon) => icon.type === "image/png" && icon.sizes === "192x192"
          );
          if (!icon) {
            return {
              errors: ["Manifest is missing a 192x192 PNG icon"],
              successes: [],
            };
          }
          const href = this.resolveUrl(baseUrl, icon.src);
          const expectedType = "image/png";
          const result = await this.validateIcon(href, expectedType, 192, 192);
          return result;
        },
      },
      {
        title: "512x512 PNG Icon",
        description:
          "Checks if the manifest has a 512x512 PNG icon for Android",
        check: async (manifest: Manifest, baseUrl: string) => {
          const icon = manifest.icons?.find(
            (icon) => icon.type === "image/png" && icon.sizes === "512x512"
          );
          if (!icon) {
            return {
              errors: ["Manifest is missing a 512x512 PNG icon"],
              successes: [],
            };
          }
          const href = this.resolveUrl(baseUrl, icon.src);
          const expectedType = "image/png";
          const result = await this.validateIcon(href, expectedType, 512, 512);
          return result;
        },
      },
    ];
  }

  async verifyWebsite(baseUrl: string): Promise<ValidationResult> {
    const html = await fetchHtml(baseUrl);
    const metaTagResults = await this.verifyMetaTags(html, baseUrl);
    const manifestHref = this.findManifestUrl(html);

    if (!manifestHref) {
      return {
        metaTags: metaTagResults,
        manifest: null,
      };
    }
    const manifestUrl = this.resolveUrl(baseUrl, manifestHref);
    const manifestJson = await fetchHtml(manifestUrl);
    const manifestResults = await this.verifyManifest(manifestJson, baseUrl);
    return {
      metaTags: metaTagResults,
      manifest: manifestResults,
    };
  }

  private async verifyMetaTags(
    html: string,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {
    const $ = cheerio.load(html);

    const foundMetaTags: MetaTag[] = [];

    $("meta, title, link, html").each((_, elem) => {
      const tag = elem.tagName.toLowerCase();
      const attributes: { [key: string]: string } = {};
      Object.entries(elem.attribs).forEach(([key, value]) => {
        attributes[key] = value;
      });
      foundMetaTags.push({ tag, attributes });
    });

    return await this.runValidation(this.metaTagRules, foundMetaTags, baseUrl);
  }

  private async verifyManifest(
    manifestJson: string,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {
    let manifest: Manifest;
    try {
      manifest = JSON.parse(manifestJson);
    } catch (error) {
      return [
        {
          title: "JSON Parsing",
          description: "Checks if the manifest is valid JSON",
          errors: [`Invalid JSON: ${error}`],
          successes: [],
        },
      ];
    }

    return await this.runValidation(this.manifestRules, manifest, baseUrl);
  }

  private async runValidation<T>(
    rules: ValidationRule<T>[],
    data: T,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {

    const results = await Promise.all(
      rules.map(async (rule) => {
        const { errors, successes } = await rule.check(data, baseUrl);
        return {
          title: rule.title,
          description: rule.description,
          errors,
          successes,
        };
      })
    );

    // Sort results (errors first, then success with warnings, then success)
    return results.sort((a, b) => {
      const calculateScore = (result: RuleValidationResult) => {
        if (result.errors.length > 0 && result.successes.length === 0) return 0;
        if (result.errors.length > 0 && result.successes.length > 0) return 1;
        return 2;
      };
      const aScore = calculateScore(a);
      const bScore = calculateScore(b);
      if (aScore !== bScore) return aScore - bScore;
      return 0;
    });
  }

  private async getImageSize(
    image: Blob
  ): Promise<{ width: number; height: number }> {
    if (!image) {
      return { width: 0, height: 0 };
    }

    const imageUrl = URL.createObjectURL(image);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({ width: 0, height: 0 });
      };
      img.src = imageUrl;
    });
  }

  private async validateIcon(
    href: string,
    expectedType?: string,
    minSize?: number,
    maxSize?: number
  ): Promise<CheckResult> {
    try {
      const errors: string[] = [];
      const successes: string[] = [];

      const image = await fetchImage(href);

      if (!image) {
        errors.push(`Image is not accessible. The URL is probably invalid.`);
        return { errors, successes };
      }

      successes.push(`Icon is accessible.`);
      const mimeType = image.type;

      if (expectedType) {
        // Handle special case for .ico files which can have multiple valid MIME types
        if (expectedType === "image/x-icon") {
          if (["image/vnd.microsoft.icon", "image/x-icon"].includes(mimeType)) {
            successes.push(
              `The image type correctly matches the actual image format (${mimeType})`
            );
            return { errors, successes };
          }
        }

        if (mimeType !== expectedType) {
          errors.push(
            `The image type does not match the actual image format. The image claims to be "${expectedType}" but is actually "${mimeType}". This can cause compatibility issues in some browsers.`
          );
        } else {
          successes.push(
            `The image type correctly matches the actual image format (${mimeType})`
          );
        }

        if (
          minSize &&
          maxSize &&
          ["image/png", "image/jpeg", "image/jpg"].includes(mimeType)
        ) {
          const result = await this.validateIconSize(image, minSize, maxSize);
          errors.push(...result.errors);
          successes.push(...result.successes);
        }
      }

      return { errors, successes };
    } catch {
      return {
        errors: ["Unable to verify icon. The URL is probably invalid."],
        successes: [],
      };
    }
  }

  private async validateIconSize(
    image: Blob,
    minSize: number,
    maxSize: number
  ): Promise<CheckResult> {
    const errors: string[] = [];
    const successes: string[] = [];

    const imageSize = await this.getImageSize(image);

    // Check if image is not smaller than minSize
    if (imageSize.width < minSize || imageSize.height < minSize) {
      errors.push(
        `Icon is too small: ${imageSize.width}x${imageSize.height}px`
      );
    }

    // Check if image is not larger than 256x256
    if (imageSize.width > maxSize || imageSize.height > maxSize) {
      errors.push(
        `Icon is too large: ${imageSize.width}x${imageSize.height}px`
      );
    }

    if (errors.length === 0) {
      successes.push(
        `Icon is sized correctly: ${imageSize.width}x${imageSize.height}px`
      );
    }

    return { errors, successes };
  }

  private findManifestUrl(html: string): string | undefined {
    const $ = cheerio.load(html);
    const manifestHref = $("link[rel='manifest']").attr("href");
    if (manifestHref) {
      return manifestHref;
    }
    return undefined;
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      const url = new URL(relativeUrl, baseUrl).href;
      return url;
    } catch (error) {
      console.error("Error resolving URL: ", error);
      if (error instanceof TypeError) {
        console.error(
          `Error resolving URL: ${relativeUrl} with base: ${baseUrl}`
        );
      }
      return relativeUrl; // Fallback to the relative URL if URL resolution fails
    }
  }
}

export default MetaValidatorService;

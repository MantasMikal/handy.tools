import { CodeOptions } from ".";

const joinBlocks = (blocks: (string | false)[]) =>
  blocks.filter(Boolean).join("\n\n") + "\n";

const jsx = (opts: CodeOptions, isSvg: boolean) =>
  joinBlocks([
    `{/* Favicon in ICO format */}
<link rel="icon" type="image/x-icon" href="/favicon.ico" ${
      isSvg ? 'sizes="any" ' : ""
    }/>`,
    isSvg &&
      `{/* SVG Favicon */}
<link rel="icon" type="image/svg+xml" href="/icon.svg" />`,
    `{/* Apple Touch Icon */}
<link rel="apple-touch-icon" type="image/png" href="/apple-touch-icon.png" />`,
    `{/* Theme Color */}
<meta name="theme-color" content="${opts.themeColor}" />`,
    `{/* Web App Manifest */}
<link rel="manifest" href="/site.webmanifest" />`,
  ]);

const html = (opts: CodeOptions, isSvg: boolean) =>
  joinBlocks([
    `<!-- Favicon in ICO format -->
<link rel="icon" type="image/x-icon" href="/favicon.ico"${
      isSvg ? ' sizes="any"' : ""
    }>`,
    isSvg &&
      `<!-- SVG Favicon -->
<link rel="icon" type="image/svg+xml" href="/icon.svg">`,
    `<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" type="image/png" href="/apple-touch-icon.png">`,
    `<!-- Theme Color -->
<meta name="theme-color" content="${opts.themeColor}">`,
    `<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">`,
  ]);

const nextjs = (
  opts: CodeOptions,
  isSvg: boolean
) => `import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  // ... Other metadata
  manifest: "/site.webmanifest",
  icons: [
    {
      url: "/favicon.ico",
      rel: "icon",
      type: "image/x-icon",${isSvg ? '\n      sizes: "any",' : ""}
    },${
      isSvg
        ? `
    {
      url: "/icon.svg",
      rel: "icon",
      type: "image/svg+xml",
    },`
        : ""
    }
    {
      url: "/apple-touch-icon.png",
      rel: "apple-touch-icon",
      type: "image/png",
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "${opts.themeColor}",
};
`;

export const getInstructionCode = (
  type: "html" | "jsx" | "nextjs",
  opts: CodeOptions,
  isSvg: boolean
): string => {
  switch (type) {
    case "html":
      return html(opts, isSvg);
    case "jsx":
      return jsx(opts, isSvg);
    case "nextjs":
      return nextjs(opts, isSvg);
    default:
      return "";
  }
};

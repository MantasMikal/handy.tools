/**
 * Here in the hooks we define data manager functions.
 * In Express.js this could be considered a controller.
 */
"use client";

export function useSvgFormatter() {
  const beautifySvg = (svg: string): string => {
    if (svg.length === 0) {
      return svg;
    }
    let beautifiedSvg: string = "";
    let tag: boolean = false;
    for (let i = 0; i < svg.length; i++) {
      const char = svg.charAt(i);
      if (char === "<") tag = true;
      else if (svg.charAt(i-1) + char === "/>") {
        // end of section
        beautifiedSvg += `${char}\n`;
        tag = false;
      }
      else if (char === ">") {
        beautifiedSvg += `${char}\n  `;
        tag = false;
      }
      if (tag && char === " " && svg.charAt(i-1) !== " ") {
        beautifiedSvg += " ";
      } else if (tag && char !== "\n" && char !== " ") {
        beautifiedSvg += char;
      }

      if (!tag && char === " ") {
        beautifiedSvg += " ";
      }
    }
    return beautifiedSvg
  };

  return { beautifySvg };
}

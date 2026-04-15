import { Config } from "svgo";

import { optimize } from "svgo/browser";

class SVGO {
  public optimizeSVG(svg: string, options: Config): string {
    console.log("Optimizing SVG...", options);
    const result = optimize(svg, {
      ...options,
    });

    if ("data" in result) {
      return result.data;
    } else {
      throw new Error("SVG optimization failed");
    }
  }
}

export default SVGO;

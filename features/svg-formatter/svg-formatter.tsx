/**
 * This file is the connection between frontend and backend.
 * Here we have page's HTML, TailWind, "endpoints" or handles.
 * In Express.JS the handles would be route handlers.
 */
"use client";

import { useState } from "react";
import { useSvgFormatter } from "./hooks/use-svg-formatter";
import { Textarea } from "@/components/ui/textarea";

export default function SvgFormatter() {
  const [beautifiedSvg, setBeautifiedSvg] = useState("");

  const {
    beautifySvg
  } = useSvgFormatter();

  return (
    
    <div className="grow flex flex-col gap-4 h-full w-full overflow-hidden">
      <h1 className="text-2xl font-bold">SVG formatter</h1>
      {<Textarea onChange={(event) => {
        console.log(event.target.value)
        const beautifiedSvg = beautifySvg(event.target.value)
        setBeautifiedSvg(beautifiedSvg)
        }} />}
      {<Textarea value={beautifiedSvg}/>}
    </div>
  );
}

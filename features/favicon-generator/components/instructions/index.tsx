import { CodeHighlight } from "@/components/ui/code-highlight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getInstructionCode } from "./get-instruction-code";
import Link from "next/link";

export type CodeOptions = {
  themeColor: string;
};

type InstructionsProps = {
  options: CodeOptions;
  isSvg: boolean;
};

export function Instructions(props: InstructionsProps) {
  const { options, isSvg } = props;
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <Tabs className="w-full h-full grow overflow-y-auto" defaultValue="html">
        <TabsList className="grid w-full gap-2 grid-cols-3">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="jsx">JSX</TabsTrigger>
          <TabsTrigger value="nextjs">NextJS</TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <p className="p-2 text-base">
            Copy the following code and paste it in your {`<head>`} tag.
          </p>
          <CodeHighlight
            language="markup"
            code={getInstructionCode("html", options, isSvg)}
            className="w-full"
          />
        </TabsContent>
        <TabsContent value="jsx">
          <p className="p-2 text-base">
            Copy the following code and paste it in your HTML {`<head>`} tag.
          </p>
          <CodeHighlight
            code={getInstructionCode("jsx", options, isSvg)}
            language="jsx"
            className="w-full"
          />
        </TabsContent>
        <TabsContent value="nextjs">
          <p className="p-2 text-base">
            Copy the following code and paste it in your _layout meta config.
          </p>
          <CodeHighlight
            code={getInstructionCode("nextjs", options, isSvg)}
            className="w-full"
          />
        </TabsContent>
      </Tabs>
      <p className="p-2 text-sm text-muted-foreground">
        The generated site.webmanifest contains placeholder names. Open it and
        set <code>name</code> and <code>short_name</code> to your site&apos;s
        name.
      </p>
      <div className="p-2 w-full mt-auto flex items-center justify-between gap-2 border bg-background rounded-md">
        <p className="p-2 text-base">
          Done? Use the meta verification tool to verify that everything is in
          place.
        </p>
        <Link href="/meta-verifier">
          <Button>Verify Meta</Button>
        </Link>
      </div>
    </div>
  );
}

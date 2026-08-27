"use client";

import Confetti from "react-confetti";
import { useState } from "react";
import { SiteUrlInput } from "./components/site-url-input";
import { useMetaVerifier } from "./hooks/use-meta-verifier";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Spinner } from "@/components/ui/spinner";
import { VerificationResult } from "./components/verification-result";
import { AnimatePresence, motion } from "framer-motion";
import { AppWindowIcon, CodeXmlIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MetaVerifier() {
  const [showConfetti, setShowConfetti] = useState(false);
  const { error, isVerifying, verifyMeta, result } = useMetaVerifier();

  const handleVerify = async (url: string) => {
    const result = await verifyMeta(url);
    const isSuccessful = result?.metaTags?.every(
      (tag) => tag.errors.length === 0
    );

    if (isSuccessful) {
      setShowConfetti(true);
    }
  };

  const isDisabled = isVerifying;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">Meta tags verifier</h1>
      <div className="grow flex flex-col gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
          <ScrollArea className="relative md:col-span-2 h-full p-2 border rounded-md bg-card">
            {!result && !isVerifying && (
              <div className="absolute flex flex-col gap-2 items-center justify-center inset-0 p-4">
                <h2 className="text-xl font-bold text-center">
                  Enter a the URL of the website you want to verify
                </h2>
                <p className="text-sm text-center text-muted-foreground max-w-[500px]">
                  Verify your website&apos;s meta tags, favicons, and web manifest
                  for SEO, browser compatibility, and PWA standards.
                </p>
              </div>
            )}
            {isVerifying && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            <div className="relative flex flex-col size-full gap-2 min-h-[300px] transition-all duration-200">
              {!isVerifying && result && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 border p-2 bg-card rounded-md">
                    <div className="flex items-center gap-2 text-lg font-semibold px-2 pt-2">
                      <CodeXmlIcon className="h-6 w-6" />
                      Meta Tags
                    </div>
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {result.metaTags.map((tag, i) => (
                          <motion.div
                            initial={{
                              opacity: 0,
                              transform: "translateY(10%)",
                            }}
                            animate={{
                              opacity: 1,
                              transform: "translateY(0%)",
                            }}
                            exit={{
                              opacity: 0,
                              transform: "translateY(10%)",
                            }}
                            key={tag.title + i}
                          >
                            <VerificationResult
                              title={tag.title}
                              description={tag.description}
                              errors={tag.errors}
                              successes={tag.successes}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                  {result.manifest && result.manifest?.length > 0 && (
                    <div className="flex flex-col gap-4  p-2 bg-card border rounded-md">
                      <div className="flex items-center gap-2 text-lg font-semibold px-2 pt-2">
                        <AppWindowIcon className="h-6 w-6" />
                        Web Manifest
                      </div>
                      <div className="flex flex-col gap-3">
                        {result.manifest.map((tag) => (
                          <VerificationResult
                            key={tag.title}
                            title={tag.title}
                            description={tag.description}
                            errors={tag.errors}
                            successes={tag.successes}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <aside className="flex flex-col col-span-1 gap-4 h-full">
            <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
              <SiteUrlInput
                isVerifying={isVerifying}
                isDisabled={isDisabled}
                onSubmit={handleVerify}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <AlertTitle>{error.type || "Error"}</AlertTitle>
                <AlertDescription>
                  {error.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col border bg-card p-4 rounded-md overflow-hidden">
              <ScrollArea>
                <h2 className="text-xl font-semibold pb-2">💡 Good to know</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    This tool checks for SEO best practices, browser
                    compatibility, and PWA requirements. While some checks (like
                    charset and viewport meta tags) are essential, others (like
                    Microsoft Tile Image or Web App Manifest) may only be
                    necessary depending on your website&apos;s needs. The tool
                    validates both meta tag presence and asset specifications
                    (like favicon dimensions and formats).
                  </p>
                </div>
              </ScrollArea>
            </div>
          </aside>
        </div>

        {showConfetti && (
          <Confetti
            numberOfPieces={1000}
            tweenDuration={8000}
            recycle={false}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
      </div>
    </div>
  );
}

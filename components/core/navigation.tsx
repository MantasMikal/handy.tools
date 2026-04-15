"use client";
import React from "react";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";
import { Menu, PocketKnifeIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Video Compressor",
    href: "/",
    description:
      "Compress your videos with minimal loss in quality using ffmpeg.",
  },
  {
    title: "Image Compressor",
    href: "/image-compressor",
    description: "Compress your images with minimal loss in quality",
  },
  {
    title: "Favicon Generator",
    href: "/favicon-generator",
    description: "Generate favicons for your website with ease.",
  },
  {
    title: "Meta Tags Verifier",
    href: "/meta-verifier",
    description: "Verify meta tags of any website.",
  },
  {
    title: "Aspect Ratio Finder",
    href: "/aspect-ratio",
    description:
      "Find the exact aspect ratio of any dimensions and the closest clean ratios.",
  },
  // {
  //   title: "SVG Minifier",
  //   href: "/svg-minifier",
  //   description: "Minify your SVG and export it as a React or React Native component",
  // },
];

export function Navigation() {

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 w-full z-50">
      <nav className="flex-col gap-6 text-lg font-medium md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <PocketKnifeIcon />
          <div className="text-sm xs:text-xl md:text-2xl">Handy Tools</div>
        </Link>
      </nav>
      <NavigationMenu className="hidden md:block">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>ToolKit</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          {/* <NavigationMenuItem>
            <Link href="/about" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                About
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem> */}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link target="_blank" rel="noopener noreferrer" href="https://github.com/MantasMikal/handy.tools">
            <GitHubLogoIcon className="size-5" />
          </Link>
        </Button>
        <ModeToggle />

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold md:text-base"
              >
                <PocketKnifeIcon />
                <div className="text-2xl">Handy Tools</div>
              </Link>
              <div className="flex flex-col gap-2">
                <div className="text-md text-muted-foreground">ToolKit</div>
                <div className="flex flex-col gap-2">
                  {components.map((c) => (
                    <Link
                      className="text-base hover:opacity-80 focus:opacity-80"
                      key={c.title}
                      href={c.href}
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

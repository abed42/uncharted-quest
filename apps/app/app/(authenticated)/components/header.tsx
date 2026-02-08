import { Poppins } from "next/font/google";
import type { ReactNode } from "react";

type HeaderProps = {
  pages: string[];
  page: string;
  children?: ReactNode;
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const Header = ({ pages, page, children }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center px-4">
      <div
        className={`${poppins.className} text-lg font-bold tracking-tight text-foreground`}
      >
        uncharted.quest
      </div>
    </div>
    {children}
  </header>
);

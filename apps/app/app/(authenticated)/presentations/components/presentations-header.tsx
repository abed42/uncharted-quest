"use client";

import { Header } from "../../components/header";
import { useChatState } from "../../components/chat-provider";
import { Button } from "@repo/design-system/components/ui/button";
import { useCallback } from "react";

export function PresentationsHeader() {
  const { deck } = useChatState();
  const title = deck?.title ?? "Pitch Deck";

  const onExport = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("print-pdf", "true");
    const pdfWindow = window.open(url.toString(), "_blank", "noopener,noreferrer");
    if (!pdfWindow) return;
    const onLoad = () => {
      pdfWindow.focus();
      pdfWindow.print();
    };
    pdfWindow.addEventListener("load", onLoad, { once: true });
  }, []);

  return (
    <Header page={title} pages={[]}>
      <div className="px-4">
        <Button size="sm" variant="default" onClick={onExport}>
          Export
        </Button>
      </div>
    </Header>
  );
}

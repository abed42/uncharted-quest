import type { Metadata } from "next";
import { Header } from "../components/header";
import { RevealViewer } from "./components/reveal-viewer";

export const metadata: Metadata = {
  title: "Presentations",
  description: "Slide deck presentations",
};

const demoSlides = [
  {
    title: "Welcome to Uncharted Quest",
    content: "AI-powered slide deck creation",
  },
  {
    title: "How It Works",
    bullets: [
      "Chat with an AI agent",
      "Describe your presentation",
      "Get a beautiful slide deck",
    ],
  },
  {
    title: "Design Templates",
    content: "Choose from multiple professionally designed templates",
  },
  {
    title: "Get Started",
    content: "Create your first presentation today!",
  },
];

export default function PresentationsPage() {
  return (
    <>
      <Header page="Presentations" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <RevealViewer slides={demoSlides} />
      </div>
    </>
  );
}

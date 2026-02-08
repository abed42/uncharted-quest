import type { Metadata } from "next";
import { PresentationsHeader } from "./components/presentations-header";
import { ArtifactPanel } from "./components/artifact-panel";

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
    children: [
      {
        title: "Step 1 — Intent",
        content: "Define the audience, goal, and the key message.",
      },
      {
        title: "Step 2 — Structure",
        content: "We generate a narrative flow with vertical drill-downs.",
      },
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
      <PresentationsHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ArtifactPanel demoSlides={demoSlides} className="min-h-[640px]" />
      </div>
    </>
  );
}

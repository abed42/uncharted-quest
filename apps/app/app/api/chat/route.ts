import { streamText, type LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";

const SYSTEM_PROMPT = `You are a pitch-deck assistant.
If you need more info, respond with JSON:
{"message":"<single direct question>"}
When you are ready to generate a deck, respond with JSON:
{"message":"<short summary>","deck":{"title":"<deck title>","subtitle":"<optional>","slides":[{"title":"...","content":"...","bullets":["..."],"children":[{"title":"...","content":"...","bullets":["..."]}]}]}}
Use "children" to create vertical (downward) slides that expand on a topic.
Always return valid JSON and nothing else.`;

export async function POST(request: Request) {
  const { messages } = await request.json();
  // Bridge ai@3 core typings with @ai-sdk/openai@1 provider typings in this repo.
  const model = openai("gpt-4o") as unknown as LanguageModelV1;

  const result = await streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    temperature: 0.4,
    maxTokens: 900,
  });

  return result.toDataStreamResponse();
}

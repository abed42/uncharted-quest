import { streamText } from "ai";
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

  const result = await streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    temperature: 0.4,
    maxTokens: 900,
  });

  return result.toDataStreamResponse();
}

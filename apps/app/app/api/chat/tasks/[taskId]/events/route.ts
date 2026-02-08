import { NextResponse } from "next/server";
import { getTask } from "@/lib/chat-task-runtime";

export async function GET(
  _: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;

  if (!taskId) {
    return NextResponse.json({ message: "Missing task id." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let lastUpdatedAt = "";

      const write = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        );
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        controller.close();
      };

      const tick = () => {
        const task = getTask(taskId);
        if (!task) {
          write("error", { message: "Task not found or expired." });
          close();
          return;
        }

        if (task.updatedAt !== lastUpdatedAt) {
          lastUpdatedAt = task.updatedAt;
          write("status", task);
        } else {
          write("ping", { taskId, timestamp: new Date().toISOString() });
        }

        if (task.status === "completed" || task.status === "failed") {
          close();
        }
      };

      const interval = setInterval(tick, 700);
      tick();
    },
    cancel() {
      // noop
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

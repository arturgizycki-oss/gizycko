"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type MessageState } from "./actions";
import { deleteMessage } from "../../messages/actions";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  deleted: boolean;
};

const POLL_MS = 5000;

export function Chat({
  matchId,
  messages,
  closed,
}: {
  matchId: string;
  messages: ChatMessage[];
  closed: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const action = sendMessage.bind(null, matchId);
  const [state, formAction, pending] = useActionState<MessageState, FormData>(
    action,
    {},
  );

  // Poor-man's realtime. Swap for a websocket or SSE when traffic justifies it.
  useEffect(() => {
    if (closed) return;
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router, closed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <ol className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-500">
            No messages yet. Say hello.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={message.mine ? "flex justify-end" : "flex justify-start"}
          >
            <div className="group max-w-[75%]">
              <div
                className={
                  message.deleted
                    ? "rounded-2xl border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-400 italic dark:border-neutral-700"
                    : message.mine
                      ? "rounded-2xl rounded-br-sm bg-rose-600 px-3 py-2 text-sm text-white"
                      : "rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
                }
              >
                <p className="whitespace-pre-wrap">
                  {message.deleted ? "This message was deleted." : message.body}
                </p>
                <time
                  dateTime={message.createdAt}
                  className={
                    message.mine && !message.deleted
                      ? "mt-1 block text-[10px] text-rose-100"
                      : "mt-1 block text-[10px] text-neutral-500"
                  }
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              {message.mine && !message.deleted && (
                <form
                  action={deleteMessage.bind(null, message.id)}
                  className="mt-0.5 text-right"
                >
                  <button
                    type="submit"
                    className="text-[10px] text-neutral-400 opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
        <div ref={bottomRef} />
      </ol>

      {closed ? (
        <p className="border-t border-neutral-200 p-4 text-center text-sm text-neutral-500 dark:border-neutral-800">
          This conversation is closed.
        </p>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
        >
          <textarea
            name="body"
            rows={1}
            required
            maxLength={4000}
            placeholder="Write a message…"
            className="flex-1 resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send
          </button>
        </form>
      )}

      {state.error && (
        <p role="alert" className="px-4 pb-3 text-sm text-rose-600">
          {state.error}
        </p>
      )}
    </div>
  );
}

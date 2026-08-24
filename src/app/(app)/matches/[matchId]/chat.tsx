"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type MessageState } from "./actions";
import { deleteMessage, toggleMessageReaction } from "../../messages/actions";
import Image from "next/image";
import { EmojiPicker } from "@/components/emoji-picker";
import { isEmojiOnly, QUICK_REACTIONS } from "@/lib/emoji";

export type ChatReaction = { emoji: string; count: number; mine: boolean };

export type ChatMedia = {
  url: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO";
  name: string | null;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  deleted: boolean;
  reactions: ChatReaction[];
  media: ChatMedia | null;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poor-man's realtime. Swap for a websocket or SSE when traffic justifies it.
  useEffect(() => {
    if (closed) return;
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router, closed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden">
      <ol className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <li className="py-8 text-center text-sm text-[var(--ink-muted)]">
            No messages yet. Say hello.
          </li>
        )}

        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}

        <div ref={bottomRef} />
      </ol>

      {closed ? (
        <p className="border-t border-[var(--line)] p-4 text-center text-sm text-[var(--ink-muted)]">
          This conversation is closed.
        </p>
      ) : (
        <Composer matchId={matchId} />
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pending, startTransition] = useTransition();

  // A short emoji-only message shows large and bare, as chat apps do.
  const big = !message.deleted && !message.media && isEmojiOnly(message.body);

  function react(emoji: string) {
    setShowPicker(false);
    startTransition(() => toggleMessageReaction(message.id, emoji));
  }

  return (
    <li className={message.mine ? "flex justify-end" : "flex justify-start"}>
      <div className="group relative max-w-[75%]">
        {message.media && !message.deleted && (
          <Attachment media={message.media} mine={message.mine} />
        )}

        {big ? (
          <p className="px-1 text-5xl leading-tight">{message.body}</p>
        ) : message.body || message.deleted ? (
          <div
            className={
              message.deleted
                ? "rounded-2xl border border-dashed border-[var(--line)] px-3 py-2 text-sm text-[var(--ink-muted)] italic"
                : message.mine
                  ? "rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white"
                  : "rounded-2xl rounded-bl-sm bg-[var(--surface-muted)] px-3 py-2 text-sm"
            }
          >
            <p className="whitespace-pre-wrap">
              {message.deleted ? "This message was deleted." : message.body}
            </p>
            <time
              dateTime={message.createdAt}
              className={
                message.mine && !message.deleted
                  ? "mt-1 block text-[10px] text-white/70"
                  : "mt-1 block text-[10px] text-[var(--ink-muted)]"
              }
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        ) : null}

        {message.reactions.length > 0 && (
          <ul
            className={
              message.mine
                ? "mt-1 flex flex-wrap justify-end gap-1"
                : "mt-1 flex flex-wrap gap-1"
            }
          >
            {message.reactions.map((reaction) => (
              <li key={reaction.emoji}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => react(reaction.emoji)}
                  aria-pressed={reaction.mine}
                  className={
                    reaction.mine
                      ? "flex items-center gap-1 rounded-full border border-brand-500 bg-brand-50 px-2 py-0.5 text-xs dark:bg-brand-900/40"
                      : "flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs"
                  }
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[var(--ink-muted)]">{reaction.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!message.deleted && (
          <div
            className={
              message.mine
                ? "absolute top-0 right-full mr-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
                : "absolute top-0 left-full ml-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
            }
          >
            <button
              type="button"
              onClick={() => setShowPicker((open) => !open)}
              aria-label="React to this message"
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-xs"
            >
              🙂
            </button>

            {message.mine && (
              <form action={deleteMessage.bind(null, message.id)}>
                <button
                  type="submit"
                  aria-label="Delete this message"
                  className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)] hover:text-rose-600"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        )}

        {showPicker && (
          <div
            className={
              message.mine
                ? "card absolute top-7 right-0 z-20 flex gap-1 p-1"
                : "card absolute top-7 left-0 z-20 flex gap-1 p-1"
            }
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                aria-label={`React with ${emoji}`}
                className="rounded-lg px-1 text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function Attachment({ media, mine }: { media: ChatMedia; mine: boolean }) {
  if (media.kind === "IMAGE") {
    return (
      <Image
        src={media.url}
        alt={media.name ?? ""}
        width={480}
        height={480}
        sizes="320px"
        className="mb-1 max-h-72 w-auto rounded-2xl object-cover"
      />
    );
  }

  if (media.kind === "VIDEO") {
    return (
      <video
        controls
        preload="metadata"
        src={media.url}
        className="mb-1 max-h-72 w-full rounded-2xl bg-black"
      >
        Your browser cannot play this video.
      </video>
    );
  }

  return (
    <figure
      className={
        mine
          ? "mb-1 rounded-2xl bg-brand-600 p-2 text-white"
          : "mb-1 rounded-2xl bg-[var(--surface-muted)] p-2"
      }
    >
      <figcaption className="mb-1 flex items-center gap-1.5 px-1 text-xs">
        <span aria-hidden>🎵</span>
        <span className="truncate">{media.name ?? "Audio"}</span>
      </figcaption>
      <audio controls preload="none" src={media.url} className="w-full">
        Your browser cannot play this audio.
      </audio>
    </figure>
  );
}

const ATTACH_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/ogg,audio/flac,audio/wav";

function Composer({ matchId }: { matchId: string }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [attached, setAttached] = useState<string | null>(null);

  const action = sendMessage.bind(null, matchId);
  const [state, formAction, pending] = useActionState<MessageState, FormData>(
    action,
    {},
  );

  /** Insert at the caret rather than appending, so mid-sentence emoji work. */
  function insert(emoji: string) {
    const field = textarea.current;
    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;

    field.value = field.value.slice(0, start) + emoji + field.value.slice(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + emoji.length;
  }

  return (
    <form action={formAction} className="relative border-t border-[var(--line)] p-3">
      {attached && (
        <p className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-1.5 text-xs">
          <span aria-hidden>📎</span>
          <span className="truncate font-medium">{attached}</span>
          <span className="muted ml-auto">sends with your message</span>
        </p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((open) => !open)}
          aria-label="Emoji"
          aria-expanded={showPicker}
          className="btn btn-secondary btn-sm shrink-0 px-2.5 text-base"
        >
          🙂
        </button>

        <label
          className="btn btn-secondary btn-sm shrink-0 cursor-pointer px-2.5 text-base"
          title="Attach a photo, video, or song"
        >
          📎
          <input
            type="file"
            name="attachment"
            accept={ATTACH_ACCEPT}
            onChange={(event) =>
              setAttached(event.target.files?.[0]?.name ?? null)
            }
            className="sr-only"
          />
        </label>

        {/* Remounting on a new submission id clears the box after sending. */}
        <MessageField key={state.submissionId ?? "new"} fieldRef={textarea} />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm shrink-0"
        >
          Send
        </button>
      </div>

      {showPicker && (
        <EmojiPicker onPick={insert} onClose={() => setShowPicker(false)} />
      )}

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

function MessageField({
  fieldRef,
}: {
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <textarea
      ref={fieldRef}
      name="body"
      rows={1}
      maxLength={4000}
      placeholder="Write a message…"
      className="input flex-1 resize-none"
    />
  );
}

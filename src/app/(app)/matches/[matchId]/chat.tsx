"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { editMessage, sendMessage, type MessageState } from "./actions";
import { deleteMessage, toggleMessageReaction } from "../../messages/actions";
import {
  MENU_BOUNDS_ATTR,
  MessageMenu,
  type MessageAction,
} from "@/components/message-menu";
import { ReportDialog } from "@/components/report-dialog";
import Image from "next/image";
import { EmojiPicker } from "@/components/emoji-picker";
import { CameraShot, VoiceRecorder } from "@/components/media-capture";
import {
  ICON_BUTTON,
  MusicIcon,
  PaperclipIcon,
  ReplyIcon,
  SendIcon,
  SmileIcon,
  PencilIcon,
} from "@/components/icons";
import { isEmojiOnly, QUICK_REACTIONS } from "@/lib/emoji";
import { useT } from "@/lib/i18n/provider";
import { useToast } from "@/components/toast";
import { prepareChatUpload } from "@/lib/upload-form";

export type ChatReaction = { emoji: string; count: number; mine: boolean };

export type ChatMedia = {
  url: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO";
  name: string | null;
};

/** The message this one answers, flattened to what the quote needs. */
export type ChatQuote = {
  id: string;
  author: string;
  body: string;
  hasMedia: boolean;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  mine: boolean;
  deleted: boolean;
  reactions: ChatReaction[];
  media: ChatMedia | null;
  replyTo: ChatQuote | null;
};

/** What the composer is doing with a message the reader picked from the menu. */
type Draft =
  | { mode: "reply"; id: string; author: string; body: string }
  | { mode: "edit"; id: string; body: string };

const POLL_MS = 8000;

export function Chat({
  matchId,
  messages,
  closed,
  otherName,
}: {
  matchId: string;
  messages: ChatMessage[];
  closed: boolean;
  /** Who you are talking to, for the quote above a reply. */
  otherName: string;
}) {
  const t = useT();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  /*
   * Poor-man's realtime: refresh the route on a timer. Swap for a websocket or
   * SSE when traffic justifies it.
   *
   * Each tick re-runs the page query on the server, so it only runs while the
   * tab is actually in front of someone. A backgrounded tab used to keep
   * polling all day, and a member with four chats open in four tabs was paying
   * for all four.
   */
  useEffect(() => {
    if (closed) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    function stop() {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    }

    function start() {
      if (timer === undefined)
        timer = setInterval(() => router.refresh(), POLL_MS);
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        // Catch up on whatever arrived while the tab was away.
        router.refresh();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, closed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div
      {...{ [MENU_BOUNDS_ATTR]: true }}
      className="card flex h-[65dvh] flex-col overflow-hidden sm:h-[70dvh]"
    >
      <ol className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
        {messages.length === 0 && (
          <li className="py-8 text-center text-sm text-[var(--ink-muted)]">
            {t("chat.empty")}
          </li>
        )}

        {messages.map((message) => (
          <Bubble
            key={message.id}
            message={message}
            matchId={matchId}
            closed={closed}
            otherName={otherName}
            onDraft={setDraft}
          />
        ))}

        <div ref={bottomRef} />
      </ol>

      {closed ? (
        <p className="border-t border-[var(--line)] p-4 text-center text-sm text-[var(--ink-muted)]">
          {t("chat.closed")}
        </p>
      ) : (
        <Composer
          matchId={matchId}
          draft={draft}
          onClearDraft={() => setDraft(null)}
        />
      )}
    </div>
  );
}

function Bubble({
  message,
  matchId,
  closed,
  otherName,
  onDraft,
}: {
  message: ChatMessage;
  matchId: string;
  closed: boolean;
  otherName: string;
  onDraft: (draft: Draft) => void;
}) {
  const t = useT();
  const [reporting, setReporting] = useState(false);
  const [pending, startTransition] = useTransition();

  // A short emoji-only message shows large and bare, as chat apps do.
  const big = !message.deleted && !message.media && isEmojiOnly(message.body);

  function react(emoji: string) {
    startTransition(() => toggleMessageReaction(message.id, emoji));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access can be refused; a prompt still lets people copy.
      window.prompt(t("chat.copyText"), text);
    }
  }

  /*
   * Reply, copy and report are offered on anybody's message. Edit and delete
   * are offered only on your own -- you may take back what you said, never
   * what somebody else said.
   */
  const actions: MessageAction[] = [];

  if (!closed) {
    actions.push({
      key: "reply",
      label: t("chat.reply"),
      icon: "reply",
      onSelect: () =>
        onDraft({
          mode: "reply",
          id: message.id,
          author: message.mine ? t("chat.you") : otherName,
          body: message.body,
        }),
    });
  }

  if (message.mine && message.body && !closed) {
    actions.push({
      key: "edit",
      label: t("chat.edit"),
      icon: "edit",
      onSelect: () =>
        onDraft({ mode: "edit", id: message.id, body: message.body }),
    });
  }

  if (message.body) {
    actions.push({
      key: "copy",
      label: t("chat.copyText"),
      icon: "copy",
      onSelect: () => void copy(message.body),
    });
  }

  actions.push({
    key: "link",
    label: t("chat.copyLink"),
    icon: "link",
    onSelect: () =>
      void copy(
        new URL(
          `/matches/${matchId}#m-${message.id}`,
          window.location.origin,
        ).toString(),
      ),
  });

  if (message.mine) {
    actions.push({
      key: "delete",
      label: t("action.delete"),
      icon: "delete",
      destructive: true,
      confirm: t("confirm.deleteMessage"),
      onSelect: () => startTransition(() => deleteMessage(message.id)),
    });
  } else {
    actions.push({
      key: "report",
      label: t("action.report"),
      icon: "report",
      onSelect: () => setReporting(true),
    });
  }

  return (
    <li
      id={`m-${message.id}`}
      className={message.mine ? "flex justify-end" : "flex justify-start"}
    >
      <div className="group relative max-w-[85%] sm:max-w-[75%]">
        {message.replyTo && !message.deleted && (
          <a
            href={`#m-${message.replyTo.id}`}
            className="mb-1 block rounded-xl border-l-2 border-brand-500 bg-[var(--surface-muted)] px-2 py-1"
          >
            <span className="block text-[11px] font-semibold text-brand-600">
              {message.replyTo.author}
            </span>
            <span className="line-clamp-2 block text-xs text-[var(--ink-muted)]">
              {message.replyTo.body || (message.replyTo.hasMedia ? "" : "")}
            </span>
          </a>
        )}

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
              {message.deleted ? t("chat.messageDeleted") : message.body}
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
              {message.editedAt && ` (${t("chat.edited")})`}
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
                  <span className="text-[var(--ink-muted)]">
                    {reaction.count}
                  </span>
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
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)]">
              <MessageMenu
                actions={actions}
                quickReactions={QUICK_REACTIONS}
                onReact={react}
              />
            </span>
          </div>
        )}

        {reporting && (
          <div className="mt-1">
            <ReportDialog target={{ messageId: message.id }} />
          </div>
        )}
      </div>
    </li>
  );
}

function Attachment({ media, mine }: { media: ChatMedia; mine: boolean }) {
  const t = useT();
  const label = {
    noVideo: t("chat.noVideo"),
    noAudio: t("chat.noAudio"),
    audio: t("chat.audio"),
  };

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
        {label.noVideo}
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
        <MusicIcon className="size-3.5 shrink-0" />
        <span className="truncate">{media.name ?? label.audio}</span>
      </figcaption>
      <audio controls preload="none" src={media.url} className="w-full">
        {label.noAudio}
      </audio>
    </figure>
  );
}

function Composer({
  matchId,
  draft,
  onClearDraft,
}: {
  matchId: string;
  draft: Draft | null;
  onClearDraft: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const form = useRef<HTMLFormElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [attached, setAttached] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(false);
  const [hasText, setHasText] = useState(false);
  const [saving, startSaving] = useTransition();
  const [sending, setSending] = useState(false);

  const action = sendMessage.bind(null, matchId);
  const [state, formAction, pending] = useActionState<MessageState, FormData>(
    action,
    {},
  );

  const editing = draft?.mode === "edit" ? draft : null;

  // A rejected send arrives as new action state; surface it over the page
  // rather than wedging it into the composer row.
  useEffect(() => {
    if (state.error) toast(state.error);
  }, [state.error, state.submissionId, toast]);

  /**
   * Editing borrows the same box rather than opening a second one, which is
   * what every chat app does and what the reply banner already prepares people
   * for. The field is keyed on the draft, so picking Edit fills it in.
   */
  function saveEdit() {
    const field = textarea.current;
    if (!editing || !field) return;

    const body = field.value;

    startSaving(async () => {
      const result = await editMessage(editing.id, body);
      if (result.error) {
        toast(result.error);
        return;
      }
      onClearDraft();
    });
  }

  /**
   * Enter sends, Shift+Enter starts a new line.
   *
   * IME composition is excluded: while somebody is picking kanji or hanzi from
   * the candidate list, Enter chooses a candidate and must not send.
   */
  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();

    if (editing) {
      saveEdit();
      return;
    }
    if (canSend) form.current?.requestSubmit();
  }

  /** Insert at the caret rather than appending, so mid-sentence emoji work. */
  function insert(emoji: string) {
    const field = textarea.current;
    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;

    field.value = field.value.slice(0, start) + emoji + field.value.slice(end);
    field.focus();
    field.selectionStart = field.selectionEnd = start + emoji.length;
    setHasText(field.value.trim().length > 0);
  }

  // The microphone gives way to Send as soon as there is something to send -
  // the same swap every chat app makes.
  const canSend = hasText || attached !== null || hasVoice;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const element = event.currentTarget;
    event.preventDefault();

    setSending(true);
    const prepared = await prepareChatUpload(element);
    setSending(false);

    if (!prepared.ok) {
      toast(prepared.error);
      return;
    }
    formAction(prepared.data);
  }

  return (
    <form
      ref={form}
      onSubmit={onSubmit}
      className="relative border-t border-[var(--line)] p-2"
    >
      {draft && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-brand-500 bg-[var(--surface-muted)] px-2 py-1.5">
          {draft.mode === "reply" ? (
            <ReplyIcon className="size-3.5 shrink-0 text-brand-600" />
          ) : (
            <PencilIcon className="size-3.5 shrink-0 text-brand-600" />
          )}

          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-brand-600">
              {draft.mode === "reply"
                ? t("chat.replyingTo")
                : t("chat.editing")}
            </span>
            <span className="block truncate text-xs text-[var(--ink-muted)]">
              {draft.body}
            </span>
          </span>

          <button
            type="button"
            onClick={onClearDraft}
            aria-label={t("action.cancel")}
            className="muted shrink-0 text-xs hover:text-rose-600"
          >
            {t("action.cancel")}
          </button>
        </div>
      )}

      {draft?.mode === "reply" && (
        <input type="hidden" name="replyTo" value={draft.id} />
      )}

      {attached && (
        <p className="mb-2 flex items-center gap-2 px-2 text-xs">
          <PaperclipIcon className="size-3.5" />
          <span className="truncate font-medium">{attached}</span>
          <button
            type="button"
            onClick={() => setAttached(null)}
            className="muted ml-auto hover:text-rose-600"
          >
            {t("action.remove")}
          </button>
        </p>
      )}

      <div className="flex items-end gap-1">
        <label
          title={t("composer.attach")}
          className={`${ICON_BUTTON} cursor-pointer`}
        >
          <PaperclipIcon />
          <input
            type="file"
            name="attachment"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/ogg,audio/flac,audio/wav"
            onChange={(event) =>
              setAttached(event.target.files?.[0]?.name ?? null)
            }
            className="sr-only"
          />
        </label>

        <CameraShot name="attachment" />

        {/*
          Remounting clears the box after a send, and fills it in when Edit
          picks a message -- both without resetting state from an effect.
        */}
        <MessageField
          key={editing ? `edit-${editing.id}` : (state.submissionId ?? "new")}
          fieldRef={textarea}
          placeholder={t("composer.messagePlaceholder")}
          defaultValue={editing?.body ?? ""}
          autoFocus={editing !== null || state.submissionId !== undefined}
          onKeyDown={onKeyDown}
          onInput={(value) => setHasText(value.trim().length > 0)}
        />

        <span className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((open) => !open)}
            aria-label={t("composer.emoji")}
            aria-expanded={showPicker}
            className={ICON_BUTTON}
          >
            <SmileIcon />
          </button>

          {/* The chat bar sits at the bottom of the panel, and the button is
              near the right edge, so the keyboard opens up and to the left. */}
          {showPicker && (
            <EmojiPicker
              placement="top"
              align="right"
              onPick={insert}
              onClose={() => setShowPicker(false)}
            />
          )}
        </span>

        {editing ? (
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving}
            className="btn btn-primary btn-sm shrink-0"
          >
            {saving ? t("action.saving") : t("action.save")}
          </button>
        ) : canSend ? (
          <button
            type="submit"
            disabled={pending || sending}
            aria-label={t("action.send")}
            className="rounded-full bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <SendIcon />
          </button>
        ) : (
          <VoiceRecorder onChange={(file) => setHasVoice(file !== null)} />
        )}
      </div>

      <p className="hint mt-1 hidden px-2 sm:block">{t("chat.sendHint")}</p>
    </form>
  );
}

function MessageField({
  fieldRef,
  onInput,
  onKeyDown,
  placeholder,
  defaultValue = "",
  autoFocus = false,
}: {
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
  onInput: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  defaultValue?: string;
  /** Set after a send or when an edit starts, never on the first render. */
  autoFocus?: boolean;
}) {
  return (
    <textarea
      ref={fieldRef}
      name="body"
      rows={1}
      maxLength={4000}
      autoFocus={autoFocus}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onInput={(event) => onInput(event.currentTarget.value)}
      className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[var(--ink-muted)]"
    />
  );
}

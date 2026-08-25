"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, StopIcon, TrashIcon } from "./icons";

/** Put a browser-made File into a real file input so it submits with the form. */
function fillInput(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;

  const transfer = new DataTransfer();
  if (file) transfer.items.add(file);
  input.files = transfer.files;
}

/**
 * Microphone button for a chat composer: one icon while idle, a stop button and
 * a running time while recording, and a small player with a discard button once
 * there is something to send.
 */
export function ChatVoice({
  name = "voice",
  onRecordedChange,
}: {
  name?: string;
  onRecordedChange?: (has: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function start() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("No microphone available.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];

      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };

      media.onstop = () => {
        const blob = new Blob(chunks.current, { type: media.mimeType });
        fillInput(input.current, new File([blob], "voice-note", { type: media.mimeType }));
        setPreview(URL.createObjectURL(blob));
        onRecordedChange?.(true);
        stream.getTracks().forEach((track) => track.stop());
      };

      media.start();
      recorder.current = media;
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone permission refused.");
    }
  }

  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }

  function discard() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSeconds(0);
    fillInput(input.current, null);
    onRecordedChange?.(false);
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <>
      <input ref={input} type="file" name={name} accept="audio/*" className="sr-only" />

      {preview ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <audio controls src={preview} className="h-8 max-w-36" />
          <button
            type="button"
            onClick={discard}
            aria-label="Discard recording"
            className="rounded-full p-1.5 text-[var(--ink-muted)] hover:text-rose-600"
          >
            <TrashIcon className="size-4" />
          </button>
        </span>
      ) : recording ? (
        <span className="flex items-center gap-1.5">
          <span className="text-xs tabular-nums text-rose-600">{clock}</span>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="rounded-full p-1.5 text-rose-600 hover:bg-[var(--surface-muted)]"
          >
            <StopIcon />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label="Record a voice note"
          title="Record a voice note"
          className="rounded-full p-1.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
        >
          <MicIcon />
        </button>
      )}

      {error && (
        <span role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </>
  );
}

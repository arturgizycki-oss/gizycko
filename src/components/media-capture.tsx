"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Put a File the browser produced into a real <input type="file"> so it submits
 * with the surrounding form. A server action reads FormData, so a recording or
 * a snapshot has to travel the same way an uploaded file does.
 */
function fillInput(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;

  const transfer = new DataTransfer();
  if (file) transfer.items.add(file);
  input.files = transfer.files;
}

/** Record a voice note with the microphone. */
export function VoiceRecorder({
  name = "voice",
  onChange,
}: {
  name?: string;
  onChange?: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recorded, setRecorded] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tick the counter while recording.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Release the preview URL and the microphone when this goes away.
  useEffect(() => {
    return () => {
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      if (recorded) URL.revokeObjectURL(recorded.url);
    };
  }, [recorded]);

  async function start() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot record audio.");
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
        const file = new File([blob], "voice-note", { type: media.mimeType });

        fillInput(input.current, file);
        setRecorded({ url: URL.createObjectURL(blob), size: blob.size });
        onChange?.(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      media.start();
      recorder.current = media;
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone permission was refused.");
    }
  }

  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }

  function discard() {
    if (recorded) URL.revokeObjectURL(recorded.url);
    setRecorded(null);
    setSeconds(0);
    fillInput(input.current, null);
    onChange?.(null);
  }

  return (
    <>
      <input ref={input} type="file" name={name} accept="audio/*" className="sr-only" />

      {!recording && !recorded && (
        <button
          type="button"
          onClick={start}
          title="Record a voice note"
          className="btn btn-secondary btn-sm cursor-pointer px-2.5 text-base"
        >
          🎤
        </button>
      )}

      {recording && (
        <button
          type="button"
          onClick={stop}
          className="btn btn-sm cursor-pointer bg-rose-600 px-2.5 text-white"
        >
          ⏹ {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </button>
      )}

      {recorded && (
        <span className="flex min-w-0 items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1">
          <span aria-hidden>🎤</span>
          <audio controls src={recorded.url} className="h-7 max-w-40" />
          <button
            type="button"
            onClick={discard}
            aria-label="Discard recording"
            className="muted text-xs hover:text-rose-600"
          >
            ✕
          </button>
        </span>
      )}

      {error && (
        <span role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </>
  );
}

/** Take a photo with the camera. */
export function CameraShot({
  name = "images",
  onChange,
}: {
  name?: string;
  onChange?: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const [live, setLive] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (shot) URL.revokeObjectURL(shot);
    };
  }, [shot]);

  async function open() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot use the camera.");
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      stream.current = media;
      setLive(true);

      // The element only exists once `live` has rendered it.
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = media;
          void video.current.play();
        }
      });
    } catch {
      setError("Camera permission was refused.");
    }
  }

  function close() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setLive(false);
  }

  function capture() {
    const element = video.current;
    if (!element) return;

    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")?.drawImage(element, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "camera-shot.jpg", { type: "image/jpeg" });
      fillInput(input.current, file);
      setShot(URL.createObjectURL(blob));
      onChange?.(file);
      close();
    }, "image/jpeg", 0.9);
  }

  function discard() {
    if (shot) URL.revokeObjectURL(shot);
    setShot(null);
    fillInput(input.current, null);
    onChange?.(null);
  }

  return (
    <>
      <input ref={input} type="file" name={name} accept="image/*" className="sr-only" />

      {!live && !shot && (
        <button
          type="button"
          onClick={open}
          title="Take a photo"
          className="btn btn-secondary btn-sm cursor-pointer px-2.5 text-base"
        >
          📸
        </button>
      )}

      {shot && (
        <span className="flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1">
          {/* A blob: URL from the camera — next/image needs a known source. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt="" className="size-8 rounded object-cover" />
          <button
            type="button"
            onClick={discard}
            aria-label="Discard photo"
            className="muted text-xs hover:text-rose-600"
          >
            ✕
          </button>
        </span>
      )}

      {live && (
        <div
          role="dialog"
          aria-label="Camera"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-4"
        >
          <video
            ref={video}
            playsInline
            muted
            className="max-h-[70vh] w-auto max-w-full rounded-2xl"
          />
          <div className="flex gap-3">
            <button type="button" onClick={capture} className="btn btn-primary btn-lg">
              Take photo
            </button>
            <button type="button" onClick={close} className="btn btn-secondary btn-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <span role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </>
  );
}

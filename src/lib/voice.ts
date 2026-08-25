export const MAX_VOICE_BYTES = 10 * 1024 * 1024;

export type VoiceKind = { extension: string; contentType: string };

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/**
 * Containers a browser recording can arrive in.
 *
 * MediaRecorder gives WebM/Opus on Chrome and Firefox, and MP4 on Safari. WebM
 * is the same container as video, so this cannot be told apart from a film by
 * its bytes alone — the field the file arrives in is what says "this is a voice
 * note", and the extension we store keeps it playing as audio.
 */
export function sniffVoice(bytes: Uint8Array): VoiceKind | null {
  if (bytes.length < 12) return null;

  // EBML: WebM or Matroska.
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { extension: ".weba", contentType: "audio/webm" };
  }

  if (ascii(bytes, 0, 4) === "OggS") {
    return { extension: ".oga", contentType: "audio/ogg" };
  }

  if (ascii(bytes, 4, 4) === "ftyp") {
    return { extension: ".m4a", contentType: "audio/mp4" };
  }

  if (ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    return { extension: ".mp3", contentType: "audio/mpeg" };
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") {
    return { extension: ".wav", contentType: "audio/wav" };
  }

  return null;
}

export type VoiceCheck =
  | { ok: true; kind: VoiceKind; bytes: Buffer }
  | { ok: false; error: string };

export async function checkUploadedVoice(file: File): Promise<VoiceCheck> {
  if (file.size === 0) return { ok: false, error: "That recording is empty." };
  if (file.size > MAX_VOICE_BYTES) {
    return { ok: false, error: "Voice notes must be 10 MB or smaller." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffVoice(bytes);
  if (!kind) return { ok: false, error: "That does not look like a recording." };

  return { ok: true, kind, bytes };
}

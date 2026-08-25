export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export type AudioKind = { extension: string; contentType: string };

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/**
 * Identify a song by its magic bytes. As with images, never trust the filename
 * or the content type the browser reports - both are attacker-controlled.
 */
export function sniffAudio(bytes: Uint8Array): AudioKind | null {
  if (bytes.length < 12) return null;

  // MP3 with an ID3 tag, or a bare MPEG frame header (11 sync bits set).
  if (ascii(bytes, 0, 3) === "ID3") {
    return { extension: ".mp3", contentType: "audio/mpeg" };
  }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return { extension: ".mp3", contentType: "audio/mpeg" };
  }

  /*
   * MP4 container: "ftyp" at offset 4. Only the audio brands count here -
   * isom/mp42/avc1 are video and belong to sniffVideo, or an uploaded film
   * would be stored and played as a song.
   */
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand.startsWith("M4A") || brand.startsWith("M4B")) {
      return { extension: ".m4a", contentType: "audio/mp4" };
    }
  }

  if (ascii(bytes, 0, 4) === "OggS") {
    return { extension: ".ogg", contentType: "audio/ogg" };
  }

  if (ascii(bytes, 0, 4) === "fLaC") {
    return { extension: ".flac", contentType: "audio/flac" };
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") {
    return { extension: ".wav", contentType: "audio/wav" };
  }

  return null;
}

export type AudioCheck =
  { ok: true; kind: AudioKind; bytes: Buffer } | { ok: false; error: string };

export async function checkUploadedAudio(file: File): Promise<AudioCheck> {
  if (file.size === 0) return { ok: false, error: "That audio file is empty." };
  if (file.size > MAX_AUDIO_BYTES) {
    return { ok: false, error: "Songs must be 10 MB or smaller." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffAudio(bytes);
  if (!kind) {
    return {
      ok: false,
      error: "Only MP3, M4A, OGG, FLAC, and WAV files are allowed.",
    };
  }

  return { ok: true, kind, bytes };
}

/** A tidy display title from the uploaded filename. */
export function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .slice(0, 200);
}

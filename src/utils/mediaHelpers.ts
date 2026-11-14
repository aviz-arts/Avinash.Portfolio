export type ResolvedMediaKind = 'video-file' | 'youtube' | 'vimeo' | 'image';

export interface ResolvedMediaSource {
  kind: ResolvedMediaKind;
  src: string;
}

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov|m4v|ogv)(\?.*|#.*)?$/i;

export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const seg = parsed.pathname.split('/').filter(Boolean)[0];
      return seg && /^[a-zA-Z0-9_-]{6,20}$/.test(seg) ? seg : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        return v && /^[a-zA-Z0-9_-]{6,20}$/.test(v) ? v : null;
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && parts[1]) {
        return /^[a-zA-Z0-9_-]{6,20}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function extractVimeoVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const numeric = [...parts].reverse().find((seg) => /^\d{5,15}$/.test(seg));
      return numeric || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveMediaSource(
  url?: string,
  hint?: 'auto' | 'image' | 'video'
): ResolvedMediaSource | null {
  const raw = (url || '').trim();
  if (!raw) return null;

  const ytId = extractYouTubeVideoId(raw);
  if (ytId) {
    return {
      kind: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`,
    };
  }

  const vimeoId = extractVimeoVideoId(raw);
  if (vimeoId) {
    return {
      kind: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (
    raw.startsWith('data:video/') ||
    VIDEO_EXT_REGEX.test(raw) ||
    hint === 'video'
  ) {
    return {
      kind: 'video-file',
      src: raw,
    };
  }

  return {
    kind: 'image',
    src: raw,
  };
}

export function sanitizeExternalLinkUrl(url?: string): string | null {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// Audio URL Helper
// Cloudflare R2 public URL for audio files

const R2_PUBLIC_BASE = 'https://pub-bc215fa64b534ea3a8cbe191e688d356.r2.dev';

export function getAudioR2Url(path: string): string {
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // If path starts with 'audio/', use it directly
  // Otherwise, prepend 'audio/' to the path
  const audioPath = cleanPath.startsWith('audio/') ? cleanPath : `audio/${cleanPath}`;
  
  return `${R2_PUBLIC_BASE}/${audioPath}`;
}

export function isLocalAudioPath(path: string): boolean {
  return path.startsWith('/audio/') || path.startsWith('audio/');
}

export function convertToBlobUrl(path: string): string {
  if (isLocalAudioPath(path)) {
    // Convert local path to R2 URL
    const cleanPath = path.replace(/^\//, ''); // Remove leading slash
    return getAudioR2Url(cleanPath);
  }
  return path;
}
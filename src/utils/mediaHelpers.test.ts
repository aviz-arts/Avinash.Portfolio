import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  extractVimeoVideoId,
  resolveMediaSource,
  sanitizeExternalLinkUrl,
} from './mediaHelpers';

test('extractYouTubeVideoId handles watch, short, shorts, and embed URLs', () => {
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/shorts/abc123XYZ_0'), 'abc123XYZ_0');
  assert.equal(extractYouTubeVideoId('https://example.com/photo.jpg'), null);
});

test('extractVimeoVideoId extracts numeric Vimeo IDs cleanly', () => {
  assert.equal(extractVimeoVideoId('https://vimeo.com/76979871'), '76979871');
  assert.equal(extractVimeoVideoId('https://player.vimeo.com/video/76979871'), '76979871');
  assert.equal(extractVimeoVideoId('https://vimeo.com/channels/staffpicks'), null);
});

test('resolveMediaSource classifies images, direct videos, YouTube, and Vimeo accurately', () => {
  assert.deepEqual(resolveMediaSource('https://youtu.be/dQw4w9WgXcQ'), {
    kind: 'youtube',
    src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0',
  });
  assert.deepEqual(resolveMediaSource('https://vimeo.com/76979871'), {
    kind: 'vimeo',
    src: 'https://player.vimeo.com/video/76979871',
  });
  assert.deepEqual(resolveMediaSource('/assets/aistudio/clip.mp4?v=1'), {
    kind: 'video-file',
    src: '/assets/aistudio/clip.mp4?v=1',
  });
  assert.deepEqual(resolveMediaSource('/assets/aistudio/shot.webp'), {
    kind: 'image',
    src: '/assets/aistudio/shot.webp',
  });
  assert.equal(resolveMediaSource('   '), null);
});

test('sanitizeExternalLinkUrl normalizes relative, mailto, and HTTPS links', () => {
  assert.equal(sanitizeExternalLinkUrl('https://artstation.com/avinash'), 'https://artstation.com/avinash');
  assert.equal(sanitizeExternalLinkUrl('mailto:aviz.arts@gmail.com'), 'mailto:aviz.arts@gmail.com');
  assert.equal(sanitizeExternalLinkUrl('artstation.com/avinash'), 'https://artstation.com/avinash');
  assert.equal(sanitizeExternalLinkUrl('/assets/resume.pdf'), '/assets/resume.pdf');
  assert.equal(sanitizeExternalLinkUrl(''), null);
});

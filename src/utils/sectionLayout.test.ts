import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultTabSectionOrder,
  reconcileTabSectionOrder,
  moveSectionInOrder,
  nudgeSectionInOrder,
  moveSectionToPosition,
  groupTabSectionsForAutoAlign,
} from './sectionLayout.ts';
import type { CustomSection } from './portfolioStorage.ts';

const SAMPLE_CUSTOM: CustomSection[] = [
  {
    id: 'custom-work-1',
    tab: 'work',
    kicker: 'GDD',
    title: 'Combat Loops',
    description: 'Combat loops breakdown',
    layout: 'cards',
    items: [],
    visible: true,
    order: 1,
  },
  {
    id: 'custom-about-1',
    tab: 'about',
    kicker: 'Rig',
    title: 'Hardware Rig',
    description: 'Hardware',
    layout: 'cards',
    items: [],
    visible: true,
    order: 2,
  },
];

test('reconcileTabSectionOrder preserves custom order, deduplicates, drops deleted custom sections, and appends new ones', () => {
  const saved = ['custom:custom-work-1', 'custom:deleted-id', 'work:reels', 'work:reels'];
  const reconciled = reconcileTabSectionOrder('work', saved, SAMPLE_CUSTOM);
  assert.deepEqual(reconciled, [
    'custom:custom-work-1',
    'work:reels',
    'work:studio',
    'work:works',
  ]);
});

test('getDefaultTabSectionOrder inserts resume custom sections cleanly after resume:executive', () => {
  const resumeCustom: CustomSection[] = [
    {
      id: 'res-extra',
      tab: 'resume',
      kicker: 'Extra',
      title: 'Talks',
      description: 'Talks',
      layout: 'cards',
      items: [],
      visible: true,
      order: 1,
    },
  ];
  const order = getDefaultTabSectionOrder('resume', resumeCustom);
  assert.equal(order.indexOf('custom:res-extra'), order.indexOf('resume:executive') + 1);
});

test('moveSectionInOrder, nudgeSectionInOrder, and moveSectionToPosition skip hidden items seamlessly', () => {
  const fullOrder = ['a', 'hidden-1', 'b', 'c'];
  const visible = ['a', 'b', 'c'];

  // Nudging 'b' up skips 'hidden-1' so 'b' visually moves before 'a' immediately
  const afterNudgeUp = nudgeSectionInOrder(fullOrder, 'b', 'up', visible);
  assert.deepEqual(afterNudgeUp, ['b', 'a', 'hidden-1', 'c']);

  // Jumping 'a' to visible index 2 puts it after 'c'
  const afterJump = moveSectionToPosition(fullOrder, 'a', 2, visible);
  assert.deepEqual(afterJump, ['hidden-1', 'b', 'c', 'a']);

  // Explicit before placement
  const explicitBefore = moveSectionInOrder(['w1', 'w2', 'w3'], 'w3', 'w1', 'before');
  assert.deepEqual(explicitBefore, ['w3', 'w1', 'w2']);
});

test('groupTabSectionsForAutoAlign auto-pairs and detaches Home, About, and Contact sections cleanly', () => {
  // Home: adjacent text & portrait align left/right in any order; separated expand full-width
  assert.deepEqual(groupTabSectionsForAutoAlign('home', ['home:hero-portrait', 'home:hero-text']), [
    { kind: 'home-split', ids: ['home:hero-portrait', 'home:hero-text'] },
  ]);
  assert.deepEqual(
    groupTabSectionsForAutoAlign('home', ['home:hero-text', 'custom:c1', 'home:hero-portrait']),
    [
      { kind: 'single', id: 'home:hero-text' },
      { kind: 'single', id: 'custom:c1' },
      { kind: 'single', id: 'home:hero-portrait' },
    ]
  );

  // About: portrait + tools/philosophy side-by-side in any side, detached items auto-align full width
  assert.deepEqual(
    groupTabSectionsForAutoAlign('about', [
      'about:tools',
      'about:philosophy',
      'about:portrait',
      'about:stats',
    ]),
    [
      { kind: 'about-split', portraitSide: 'right', stackIds: ['about:tools', 'about:philosophy'] },
      { kind: 'single', id: 'about:stats' },
    ]
  );
  assert.deepEqual(
    groupTabSectionsForAutoAlign('about', [
      'about:portrait',
      'about:philosophy',
      'about:stats',
      'about:tools',
    ]),
    [
      { kind: 'about-split', portraitSide: 'left', stackIds: ['about:philosophy'] },
      { kind: 'single', id: 'about:stats' },
      { kind: 'single', id: 'about:tools' },
    ]
  );

  // Contact: email & phone pair when adjacent (swappable) and auto-expand when separated
  assert.deepEqual(
    groupTabSectionsForAutoAlign('contact', ['contact:phone', 'contact:email', 'contact:form']),
    [
      { kind: 'contact-pair', ids: ['contact:phone', 'contact:email'] },
      { kind: 'single', id: 'contact:form' },
    ]
  );
  assert.deepEqual(
    groupTabSectionsForAutoAlign('contact', ['contact:email', 'contact:form', 'contact:phone']),
    [
      { kind: 'single', id: 'contact:email' },
      { kind: 'single', id: 'contact:form' },
      { kind: 'single', id: 'contact:phone' },
    ]
  );
});

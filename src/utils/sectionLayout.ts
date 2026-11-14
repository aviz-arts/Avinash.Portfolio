import type { CustomSection, SiteContent } from './portfolioStorage';

export type TabId = 'home' | 'work' | 'about' | 'resume' | 'contact';

export interface BuiltInSectionMeta {
  id: string;
  label: string;
  visibilityKey?: keyof SiteContent;
}

export const TAB_BUILTIN_SECTIONS: Record<TabId, BuiltInSectionMeta[]> = {
  home: [
    { id: 'home:hero-text', label: 'Hero Intro & Actions', visibilityKey: 'homeShowHeroText' },
    { id: 'home:hero-portrait', label: 'Artist Portrait Card', visibilityKey: 'homeShowPortrait' },
  ],
  work: [
    { id: 'work:studio', label: '3D Lighting Studio', visibilityKey: 'workShowStudio' },
    { id: 'work:works', label: 'Featured Works Grid', visibilityKey: 'workShowWorksGrid' },
    { id: 'work:reels', label: 'Cinematic Reels & A/B Slider', visibilityKey: 'workShowReels' },
  ],
  about: [
    { id: 'about:portrait', label: 'Portrait & Profile Card', visibilityKey: 'aboutShowPortrait' },
    { id: 'about:philosophy', label: 'Core Philosophy Card', visibilityKey: 'aboutShowPhilosophy' },
    { id: 'about:tools', label: 'Toolset & Competencies', visibilityKey: 'aboutShowTools' },
    { id: 'about:stats', label: 'Track Record Metrics', visibilityKey: 'aboutShowStats' },
    { id: 'about:timeline', label: 'Career Timeline', visibilityKey: 'aboutShowTimeline' },
  ],
  resume: [
    { id: 'resume:header', label: 'Resume Header & Actions' },
    { id: 'resume:benchmarks', label: 'Production Benchmarks', visibilityKey: 'resumeShowBenchmarks' },
    { id: 'resume:executive', label: 'Executive Profile', visibilityKey: 'resumeShowExecutiveProfile' },
    { id: 'resume:skills', label: 'Technical Matrix', visibilityKey: 'resumeShowSkills' },
    { id: 'resume:education', label: 'Education & Accreditations', visibilityKey: 'resumeShowEducation' },
    { id: 'resume:competency', label: 'Core Competency Cards', visibilityKey: 'workShowLevelDesign' },
  ],
  contact: [
    { id: 'contact:header', label: 'Contact Heading' },
    { id: 'contact:clock', label: 'Live IST Clock' },
    { id: 'contact:email', label: 'Primary Email Card', visibilityKey: 'contactShowEmailCard' },
    { id: 'contact:phone', label: 'Phone / WhatsApp Card', visibilityKey: 'contactShowPhoneCard' },
    { id: 'contact:form', label: 'Direct Message Form', visibilityKey: 'contactShowForm' },
    { id: 'contact:socials', label: 'Social Platforms Grid', visibilityKey: 'contactShowSocials' },
    { id: 'contact:location', label: 'Location Badge', visibilityKey: 'contactShowLocation' },
  ],
};

export function toCustomSectionBlockId(customId: string): string {
  return `custom:${customId}`;
}

export function parseCustomSectionBlockId(blockId: string): string | null {
  return blockId.startsWith('custom:') ? blockId.slice(7) : null;
}

export function getDefaultTabSectionOrder(
  tab: TabId,
  customSections: CustomSection[] = []
): string[] {
  const builtInIds = TAB_BUILTIN_SECTIONS[tab].map((s) => s.id);
  const customIds = customSections
    .filter((s) => s.tab === tab)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => toCustomSectionBlockId(s.id));

  // Preserve original Resume tab position where custom sections sit after Executive Profile by default
  if (tab === 'resume' && customIds.length > 0) {
    const execIdx = builtInIds.indexOf('resume:executive');
    if (execIdx >= 0) {
      const next = [...builtInIds];
      next.splice(execIdx + 1, 0, ...customIds);
      return next;
    }
  }

  return [...builtInIds, ...customIds];
}

export function reconcileTabSectionOrder(
  tab: TabId,
  savedOrder: string[] | undefined,
  customSections: CustomSection[] = []
): string[] {
  const defaults = getDefaultTabSectionOrder(tab, customSections);
  const validSet = new Set(defaults);

  if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
    return defaults;
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of savedOrder) {
    if (validSet.has(id) && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }

  for (const id of defaults) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }

  return result;
}

export function moveSectionInOrder(
  order: string[],
  sourceId: string,
  targetId: string,
  placement: 'before' | 'after' | 'auto' = 'auto'
): string[] {
  if (sourceId === targetId) return order;
  const sourceIdx = order.indexOf(sourceId);
  const targetIdx = order.indexOf(targetId);
  if (sourceIdx === -1 || targetIdx === -1) return order;

  const next = [...order];
  const [moved] = next.splice(sourceIdx, 1);
  const newTargetIdx = next.indexOf(targetId);

  if (placement === 'before') {
    next.splice(newTargetIdx, 0, moved);
  } else if (placement === 'after') {
    next.splice(newTargetIdx + 1, 0, moved);
  } else {
    // 'auto': if dragged downwards, drop after target; if dragged upwards, drop before target
    if (sourceIdx < targetIdx) {
      next.splice(newTargetIdx + 1, 0, moved);
    } else {
      next.splice(newTargetIdx, 0, moved);
    }
  }

  return next;
}

export function nudgeSectionInOrder(
  order: string[],
  id: string,
  direction: 'up' | 'down',
  visibleIds?: string[]
): string[] {
  const list = visibleIds && visibleIds.length > 0 ? visibleIds : order;
  const visIdx = list.indexOf(id);
  if (visIdx === -1) return order;

  const targetVisIdx = direction === 'up' ? visIdx - 1 : visIdx + 1;
  if (targetVisIdx < 0 || targetVisIdx >= list.length) return order;

  const targetId = list[targetVisIdx];
  return moveSectionInOrder(order, id, targetId, direction === 'up' ? 'before' : 'after');
}

export function moveSectionToPosition(
  order: string[],
  sourceId: string,
  targetVisibleIndex: number,
  visibleIds?: string[]
): string[] {
  const list = visibleIds && visibleIds.length > 0 ? visibleIds : order;
  const clampedIdx = Math.max(0, Math.min(list.length - 1, targetVisibleIndex));
  const currentVisIdx = list.indexOf(sourceId);
  if (currentVisIdx === -1 || currentVisIdx === clampedIdx) return order;

  const targetId = list[clampedIdx];
  const placement = clampedIdx < currentVisIdx ? 'before' : 'after';
  return moveSectionInOrder(order, sourceId, targetId, placement);
}

export function getSectionLabel(
  tab: TabId,
  blockId: string,
  customSections: CustomSection[] = []
): string {
  const customId = parseCustomSectionBlockId(blockId);
  if (customId) {
    const found = customSections.find((s) => s.id === customId);
    return found?.title || found?.kicker || 'Custom Section';
  }
  const builtIn = TAB_BUILTIN_SECTIONS[tab].find((b) => b.id === blockId);
  return builtIn?.label || blockId;
}

export type TabLayoutGroup =
  | { kind: 'single'; id: string }
  | { kind: 'home-split'; ids: [string, string] }
  | { kind: 'about-split'; portraitSide: 'left' | 'right'; stackIds: string[] }
  | { kind: 'contact-pair'; ids: [string, string] };

const ABOUT_SPLIT_SET = new Set(['about:portrait', 'about:philosophy', 'about:tools']);

/**
 * Automatically groups adjacent split-compatible sections into balanced multi-column
 * rows while expanding separated or standalone sections cleanly to full container width.
 */
export function groupTabSectionsForAutoAlign(
  tab: TabId,
  visibleOrderedIds: string[]
): TabLayoutGroup[] {
  const groups: TabLayoutGroup[] = [];
  let i = 0;

  while (i < visibleOrderedIds.length) {
    const id = visibleOrderedIds[i];
    const next = visibleOrderedIds[i + 1];

    if (
      tab === 'home' &&
      next &&
      ((id === 'home:hero-text' && next === 'home:hero-portrait') ||
        (id === 'home:hero-portrait' && next === 'home:hero-text'))
    ) {
      groups.push({ kind: 'home-split', ids: [id, next] });
      i += 2;
      continue;
    }

    if (
      tab === 'contact' &&
      next &&
      ((id === 'contact:email' && next === 'contact:phone') ||
        (id === 'contact:phone' && next === 'contact:email'))
    ) {
      groups.push({ kind: 'contact-pair', ids: [id, next] });
      i += 2;
      continue;
    }

    if (tab === 'about' && ABOUT_SPLIT_SET.has(id)) {
      const run: string[] = [];
      let j = i;
      while (j < visibleOrderedIds.length && ABOUT_SPLIT_SET.has(visibleOrderedIds[j])) {
        run.push(visibleOrderedIds[j]);
        j++;
      }

      const portraitIdx = run.indexOf('about:portrait');
      if (portraitIdx !== -1 && run.length >= 2) {
        if (portraitIdx === 0) {
          groups.push({
            kind: 'about-split',
            portraitSide: 'left',
            stackIds: run.slice(1),
          });
        } else if (portraitIdx === run.length - 1) {
          groups.push({
            kind: 'about-split',
            portraitSide: 'right',
            stackIds: run.slice(0, -1),
          });
        } else {
          // Portrait sandwiched between two stack items: promote leading item to full width,
          // then pair Portrait (left) + trailing item (right) cleanly
          groups.push({ kind: 'single', id: run[0] });
          groups.push({
            kind: 'about-split',
            portraitSide: 'left',
            stackIds: run.slice(portraitIdx + 1),
          });
        }
      } else {
        for (const singleId of run) {
          groups.push({ kind: 'single', id: singleId });
        }
      }
      i = j;
      continue;
    }

    groups.push({ kind: 'single', id });
    i += 1;
  }

  return groups;
}

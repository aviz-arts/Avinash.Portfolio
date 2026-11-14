import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomSection,
  CustomSectionItem,
  CustomSectionLayout,
  SiteContent,
} from '../../utils/portfolioStorage';
import {
  TAB_BUILTIN_SECTIONS,
  TabId,
  reconcileTabSectionOrder,
  moveSectionInOrder,
  nudgeSectionInOrder,
  moveSectionToPosition,
  toCustomSectionBlockId,
  getSectionLabel,
  parseCustomSectionBlockId,
} from '../../utils/sectionLayout';
import { MediaUploadField } from '../common/MediaUploadField';
import {
  X,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Layers,
  Check,
  Sparkles,
  RotateCcw,
  GripVertical,
  Copy,
  Image as ImageIcon,
  Film,
  BookOpen,
  Link2,
} from 'lucide-react';

interface BuiltInSectionEntry {
  tab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  key: keyof SiteContent;
  label: string;
  isSubSection?: boolean;
}

const BUILTIN_SECTION_ENTRIES: BuiltInSectionEntry[] = [
  { tab: 'home', key: 'homeShowHeroText', label: 'Hero Headline & Primary Actions' },
  { tab: 'home', key: 'homeShowPortrait', label: 'Hero Portrait Card & Direct Inquiry' },
  { tab: 'work', key: 'workShowStudio', label: '3D Interactive Lighting Studio' },
  { tab: 'work', key: 'workShowWorksGrid', label: 'Featured Works Portfolio Grid' },
  { tab: 'work', key: 'workShowReels', label: 'Cinematic Reels & A/B Comparison Section' },
  { tab: 'work', key: 'workShowReelPlayer', label: 'Video Reel Player', isSubSection: true },
  { tab: 'work', key: 'workShowAbSlider', label: 'A/B Lighting Comparison Slider', isSubSection: true },
  { tab: 'about', key: 'aboutShowPortrait', label: 'About Portrait & Profile Card' },
  { tab: 'about', key: 'aboutShowPhilosophy', label: 'Core Philosophy Statement Card' },
  { tab: 'about', key: 'aboutShowTools', label: 'Toolset & Core Competencies Matrix' },
  { tab: 'about', key: 'aboutShowStats', label: 'Production Track Record KPI Strip' },
  { tab: 'about', key: 'aboutShowTimeline', label: 'Interactive Career Timeline & Photos' },
  { tab: 'resume', key: 'resumeShowBenchmarks', label: 'Production Benchmarks KPI Grid' },
  { tab: 'resume', key: 'resumeShowExecutiveProfile', label: 'Executive Design Profile Summary' },
  { tab: 'resume', key: 'resumeShowSkills', label: 'Core Technical Competencies Matrix' },
  { tab: 'resume', key: 'resumeShowEducation', label: 'Education & Certifications' },
  { tab: 'resume', key: 'workShowLevelDesign', label: 'Core Competency & Focus Cards' },
  { tab: 'contact', key: 'contactShowEmailCard', label: 'Primary Email Card' },
  { tab: 'contact', key: 'contactShowPhoneCard', label: 'Phone / WhatsApp Card' },
  { tab: 'contact', key: 'contactShowForm', label: 'Direct Inquiry Form' },
  { tab: 'contact', key: 'contactShowSocials', label: 'Social Platforms Grid' },
  { tab: 'contact', key: 'contactShowLocation', label: 'Location & Availability Strip' },
];

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: CustomSection[];
  onSaveSections: (sections: CustomSection[]) => void;
  siteContent?: SiteContent;
  onUpdateSiteContent?: (key: keyof SiteContent, value: any) => void;
  initialTab?: 'home' | 'work' | 'about' | 'resume' | 'contact';
  initialSectionToEdit?: CustomSection | null;
}

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({
  isOpen,
  onClose,
  sections,
  onSaveSections,
  siteContent,
  onUpdateSiteContent,
  initialTab = 'work',
  initialSectionToEdit = null,
}) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'home' | 'work' | 'about' | 'resume' | 'contact'>('all');
  const [editingSection, setEditingSection] = useState<CustomSection | null>(initialSectionToEdit);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for creating/editing a single section
  const [formData, setFormData] = useState<Partial<CustomSection>>({
    tab: initialTab,
    kicker: '',
    title: '',
    description: '',
    bodyContent: '',
    coverMediaUrl: '',
    coverMediaType: 'auto',
    coverMediaCaption: '',
    mediaPlacement: 'top',
    ctaLabel: '',
    ctaUrl: '',
    layout: 'editorial',
    visible: true,
    items: [],
  });
  const [targetSlotIndex, setTargetSlotIndex] = useState<number>(0);

  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverOrderId, setDragOverOrderId] = useState<string | null>(null);

  const getInitialSlotIndexForTab = (
    tab: TabId,
    sectionId?: string,
    sourceSections: CustomSection[] = sections
  ): number => {
    const currentOrder = reconcileTabSectionOrder(
      tab,
      siteContent?.tabSectionOrders?.[tab],
      sourceSections
    );
    if (sectionId) {
      const idx = currentOrder.indexOf(toCustomSectionBlockId(sectionId));
      if (idx >= 0) return idx;
    }
    return currentOrder.length;
  };

  useEffect(() => {
    if (isOpen) {
      setEditingSection(initialSectionToEdit);
      setIsCreatingNew(false);
      setFormError(null);
      setActiveTabFilter(initialSectionToEdit?.tab || initialTab || 'all');
      setDraggedOrderId(null);
      setDragOverOrderId(null);
      if (initialSectionToEdit) {
        setFormData({
          ...initialSectionToEdit,
          items: initialSectionToEdit.items.map((it) => ({
            ...it,
            highlights: it.highlights ? [...it.highlights] : [],
          })),
        });
        setTargetSlotIndex(
          getInitialSlotIndexForTab(initialSectionToEdit.tab, initialSectionToEdit.id, sections)
        );
      }
    }
  }, [isOpen, initialSectionToEdit, initialTab]);

  const placementPreviewSlots = useMemo(() => {
    const tab = (formData.tab || 'work') as TabId;
    const baseOrder = reconcileTabSectionOrder(
      tab,
      siteContent?.tabSectionOrders?.[tab],
      sections
    );
    const selfBlockId =
      editingSection && editingSection.tab === tab
        ? toCustomSectionBlockId(editingSection.id)
        : null;
    const otherIds = selfBlockId
      ? baseOrder.filter((id) => id !== selfBlockId)
      : baseOrder;

    return Array.from({ length: otherIds.length + 1 }, (_, slotIdx) => {
      const prevLabel =
        slotIdx > 0 ? getSectionLabel(tab, otherIds[slotIdx - 1], sections) : null;
      const nextLabel =
        slotIdx < otherIds.length ? getSectionLabel(tab, otherIds[slotIdx], sections) : null;

      if (slotIdx === 0) {
        return {
          index: slotIdx,
          label: nextLabel ? `#1 — Very Top (before "${nextLabel}")` : '#1 — Top of Tab',
        };
      }
      if (slotIdx === otherIds.length) {
        return {
          index: slotIdx,
          label: prevLabel
            ? `#${slotIdx + 1} — End of Tab (after "${prevLabel}")`
            : `#${slotIdx + 1} — End of Tab`,
        };
      }
      return {
        index: slotIdx,
        label: `#${slotIdx + 1} — Between "${prevLabel}" & "${nextLabel}"`,
      };
    });
  }, [formData.tab, siteContent?.tabSectionOrders, sections, editingSection]);

  if (!isOpen) return null;

  const buildStarterFormData = (
    tab: TabId,
    layout: CustomSectionLayout,
    existingId?: string
  ): Partial<CustomSection> => {
    const id = existingId || `section-${Date.now()}`;
    const now = Date.now();

    if (layout === 'editorial') {
      return {
        id,
        tab,
        kicker: 'EDITORIAL BREAKDOWN · MEDIA SPOTLIGHT',
        title: 'Behind the Scenes: Architecture, Media & Notes',
        description:
          'Add an editorial story paired with a hero photo, gameplay video, YouTube/Vimeo reel, or supporting breakdown cards.',
        bodyContent:
          'Use this long-form editorial block to walk visitors through production constraints, iteration milestones, visual storytelling choices, and measurable outcomes.\n\nSeparate paragraphs with a blank line. You can attach a photo or video alongside this story and freely move this entire section anywhere inside the tab.',
        coverMediaUrl: '',
        coverMediaType: 'auto',
        coverMediaCaption: '',
        mediaPlacement: 'left',
        ctaLabel: '',
        ctaUrl: '',
        layout: 'editorial',
        visible: true,
        order: sections.length + 1,
        items: [],
      };
    }

    if (layout === 'gallery') {
      return {
        id,
        tab,
        kicker: 'VISUAL GALLERY · PHOTO & VIDEO SHOWCASE',
        title: 'Production Stills, Clips & Breakdown Frames',
        description:
          'Curated grid of uploaded screenshots, rendered MP4 clips, or YouTube/Vimeo sequences with captions and notes.',
        bodyContent: '',
        coverMediaUrl: '',
        coverMediaType: 'auto',
        coverMediaCaption: '',
        mediaPlacement: 'top',
        ctaLabel: '',
        ctaUrl: '',
        layout: 'gallery',
        visible: true,
        order: sections.length + 1,
        items: [
          {
            id: `item-${now}-1`,
            title: 'Key Frame / Video Pass #1',
            subtitle: 'Unreal Engine 5 · Real-Time Capture',
            description: 'Explain lighting setup, camera framing, or gameplay beat shown in this media.',
            tag: 'Visual Pass · 01',
            mediaUrl: '',
            mediaType: 'auto',
            mediaCaption: '',
            highlights: [],
          },
          {
            id: `item-${now}-2`,
            title: 'Key Frame / Video Pass #2',
            subtitle: 'Iteration & Final Polish',
            description: 'Highlight environment storytelling, contrast ratios, or encounter pacing details.',
            tag: 'Visual Pass · 02',
            mediaUrl: '',
            mediaType: 'auto',
            mediaCaption: '',
            highlights: [],
          },
        ],
      };
    }

    if (layout === 'stats') {
      return {
        id,
        tab,
        kicker: 'PRODUCTION BENCHMARKS',
        title: 'Shipped Releases & Performance Benchmarks',
        description: 'Key quantifiable metrics, core design contributions, and frametime budgets.',
        bodyContent: '',
        coverMediaUrl: '',
        coverMediaType: 'auto',
        coverMediaCaption: '',
        mediaPlacement: 'top',
        ctaLabel: '',
        ctaUrl: '',
        layout: 'stats',
        visible: true,
        order: sections.length + 1,
        items: [
          {
            id: `item-${now}-1`,
            title: '4 Titles',
            subtitle: 'Shipped Releases (PC/Console)',
            description: 'Commercial releases shipped across Steam and next-gen consoles.',
            tag: '',
          },
          {
            id: `item-${now}-2`,
            title: '100% Core',
            subtitle: 'Game Design & Mechanics Focus',
            description: 'Gameplay loops, combat systems, and pacing architecture.',
            tag: 'red',
          },
          {
            id: `item-${now}-3`,
            title: '7+ Years',
            subtitle: 'Game Industry Experience',
            description: 'Senior design and technical lighting production experience.',
            tag: '',
          },
          {
            id: `item-${now}-4`,
            title: '60.0 FPS',
            subtitle: 'Lumen Console Frametime (Passion)',
            description: 'Unreal Engine 5 real-time global illumination optimization.',
            tag: '',
          },
        ],
      };
    }

    if (layout === 'callout') {
      return {
        id,
        tab,
        kicker: 'EXECUTIVE DESIGN PROFILE',
        title: 'Core Philosophy & Direction',
        description:
          'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion as a Lighting Artist.',
        bodyContent: '',
        coverMediaUrl: '',
        coverMediaType: 'auto',
        coverMediaCaption: '',
        mediaPlacement: 'top',
        ctaLabel: '',
        ctaUrl: '',
        layout: 'callout',
        visible: true,
        order: sections.length + 1,
        items: [],
      };
    }

    return {
      id,
      tab,
      kicker: 'CUSTOM SHOWCASE · SPOTLIGHT',
      title: 'New Section Title',
      description: 'Describe this section and what makes this workflow, level geometry, or lighting approach unique.',
      bodyContent: '',
      coverMediaUrl: '',
      coverMediaType: 'auto',
      coverMediaCaption: '',
      mediaPlacement: 'top',
      ctaLabel: '',
      ctaUrl: '',
      layout,
      visible: true,
      order: sections.length + 1,
      items: [
        {
          id: `item-${now}-1`,
          title: 'Primary Highlight',
          subtitle: 'Technical Focus / Specification',
          description: 'Provide technical breakdown, frame budget, or level design metric here.',
          tag: 'Highlight · 2025',
          mediaUrl: '',
          mediaType: 'auto',
          mediaCaption: '',
          highlights: ['Modular system architecture', '60 FPS real-time budget validated'],
        },
      ],
    };
  };

  const handleStartNewSection = (
    tab: TabId = initialTab,
    layout: CustomSectionLayout = 'editorial'
  ) => {
    setIsCreatingNew(true);
    setEditingSection(null);
    setFormError(null);
    setFormData(buildStarterFormData(tab, layout));
    setTargetSlotIndex(getInitialSlotIndexForTab(tab, undefined, sections));
  };

  const handleApplyCreateTemplate = (layout: CustomSectionLayout) => {
    const tab = (formData.tab || initialTab || 'work') as TabId;
    const starter = buildStarterFormData(tab, layout, formData.id);
    setFormData((prev) => ({
      ...starter,
      tab: prev.tab || tab,
    }));
  };

  const handleStartEdit = (sec: CustomSection) => {
    setEditingSection(sec);
    setIsCreatingNew(false);
    setFormError(null);
    setFormData({
      ...sec,
      items: sec.items.map((it) => ({
        ...it,
        highlights: it.highlights ? [...it.highlights] : [],
      })),
    });
    setTargetSlotIndex(getInitialSlotIndexForTab(sec.tab, sec.id, sections));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setFormError('Section title is required.');
      return;
    }
    setFormError(null);

    const cleanedItems: CustomSectionItem[] = (formData.items || []).map((it) => ({
      ...it,
      highlights: (it.highlights || []).map((h) => h.trim()).filter(Boolean),
    }));

    let savedSection: CustomSection;
    let updated: CustomSection[];
    const previousTab = editingSection?.tab;

    if (isCreatingNew) {
      savedSection = {
        id: formData.id || `section-${Date.now()}`,
        tab: (formData.tab || 'work') as TabId,
        kicker: formData.kicker || 'Special Showcase',
        title: formData.title.trim(),
        description: formData.description || '',
        bodyContent: formData.bodyContent || '',
        coverMediaUrl: formData.coverMediaUrl || '',
        coverMediaType: formData.coverMediaType || 'auto',
        coverMediaCaption: formData.coverMediaCaption || '',
        mediaPlacement: formData.mediaPlacement || 'top',
        ctaLabel: formData.ctaLabel || '',
        ctaUrl: formData.ctaUrl || '',
        layout: (formData.layout || 'editorial') as CustomSectionLayout,
        visible: formData.visible !== false,
        order: sections.length + 1,
        items: cleanedItems,
      };
      updated = [...sections, savedSection];
    } else if (editingSection) {
      savedSection = {
        ...editingSection,
        ...formData,
        title: formData.title.trim(),
        items: cleanedItems,
      } as CustomSection;
      updated = sections.map((s) => (s.id === editingSection.id ? savedSection : s));
    } else {
      return;
    }

    onSaveSections(updated);

    // Place saved section cleanly at chosen position inside its target tab
    if (siteContent && onUpdateSiteContent) {
      const targetTab = savedSection.tab;
      const blockId = toCustomSectionBlockId(savedSection.id);
      const nextOrdersMap = { ...(siteContent.tabSectionOrders || {}) };

      if (previousTab && previousTab !== targetTab && nextOrdersMap[previousTab]) {
        nextOrdersMap[previousTab] = reconcileTabSectionOrder(
          previousTab,
          nextOrdersMap[previousTab],
          updated
        );
      }

      const reconciledTarget = reconcileTabSectionOrder(
        targetTab,
        nextOrdersMap[targetTab],
        updated
      );
      const clampedSlot = Math.max(0, Math.min(reconciledTarget.length - 1, targetSlotIndex));
      nextOrdersMap[targetTab] = moveSectionToPosition(reconciledTarget, blockId, clampedSlot);
      onUpdateSiteContent('tabSectionOrders', nextOrdersMap);
    }

    setEditingSection(null);
    setIsCreatingNew(false);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this custom section?')) {
      const updated = sections.filter((s) => s.id !== id);
      onSaveSections(updated);
      if (editingSection?.id === id) {
        setEditingSection(null);
        setIsCreatingNew(false);
      }
    }
  };

  const handleToggleVisibility = (id: string) => {
    const updated = sections.map((s) => {
      if (s.id === id) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });
    onSaveSections(updated);
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newArr = [...sections];
    const [moved] = newArr.splice(idx, 1);
    newArr.splice(targetIdx, 0, moved);

    // Reassign order indices
    const updated = newArr.map((sec, i) => ({ ...sec, order: i + 1 }));
    onSaveSections(updated);
  };

  // Item helpers in form
  const handleAddItemToForm = () => {
    const newItem: CustomSectionItem = {
      id: `item-${Date.now()}`,
      title: formData.layout === 'gallery' ? 'New Media Item' : 'New Card Item',
      subtitle: 'Category / Engine Pass',
      description: 'Detail technical implementation, engine parameters, or production notes.',
      tag: formData.layout === 'gallery' ? 'Media Entry' : 'New Card',
      mediaUrl: '',
      mediaType: 'auto',
      mediaCaption: '',
      highlights: [],
    };
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleUpdateFormItem = <K extends keyof CustomSectionItem>(
    itemId: string,
    field: K,
    val: CustomSectionItem[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).map((it) => (it.id === itemId ? { ...it, [field]: val } : it)),
    }));
  };

  const handleMoveFormItem = (itemId: string, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const list = [...(prev.items || [])];
      const idx = list.findIndex((it) => it.id === itemId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const [moved] = list.splice(idx, 1);
      list.splice(targetIdx, 0, moved);
      return { ...prev, items: list };
    });
  };

  const handleDuplicateFormItem = (item: CustomSectionItem) => {
    const copyItem: CustomSectionItem = {
      ...item,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${item.title} (Copy)`,
      highlights: item.highlights ? [...item.highlights] : [],
    };
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), copyItem],
    }));
  };

  const handleDeleteFormItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((it) => it.id !== itemId),
    }));
  };

  const displayedSections = sections.filter(
    (s) => activeTabFilter === 'all' || s.tab === activeTabFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0c] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-zinc-100">
                Tab Sections &amp; Editorial Studio
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Create rich photo, video, editorial, or card sections and place them freely in any tab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Action Bar */}
          {!isCreatingNew && !editingSection ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Tab Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono">
                  {(['all', 'home', 'work', 'about', 'resume', 'contact'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTabFilter(t)}
                      className={`px-3 py-1.5 rounded-lg transition-colors capitalize cursor-pointer ${
                        activeTabFilter === t
                          ? 'bg-red-600 text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t === 'all' ? 'All Tabs' : `${t} Tab`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      handleStartNewSection(
                        activeTabFilter !== 'all' ? activeTabFilter : initialTab,
                        'editorial'
                      )
                    }
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30 cursor-pointer whitespace-nowrap"
                    title="Create rich editorial story with photo/video cover, article paragraphs, and CTA"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>+ Editorial + Media</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStartNewSection(
                        activeTabFilter !== 'all' ? activeTabFilter : initialTab,
                        'gallery'
                      )
                    }
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    title="Create photo/video showcase grid (uploads, MP4, YouTube, Vimeo)"
                  >
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span>+ Photo / Video Grid</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStartNewSection(
                        activeTabFilter !== 'all' ? activeTabFilter : 'work',
                        'cards'
                      )
                    }
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-400" />
                    <span>+ Cards Grid</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStartNewSection(
                        activeTabFilter !== 'all' ? activeTabFilter : 'resume',
                        'stats'
                      )
                    }
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    title="Add KPI Benchmarks Strip like 4 Titles, 100% Core..."
                  >
                    <Plus className="w-3.5 h-3.5 text-red-400" />
                    <span>+ Benchmarks</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStartNewSection(
                        activeTabFilter !== 'all' ? activeTabFilter : 'resume',
                        'callout'
                      )
                    }
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    title="Add Executive Design Profile Narrative Box"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-400" />
                    <span>+ Callout</span>
                  </button>
                </div>
              </div>

              {/* Unified Tab Section Order (Built-In + Custom) when a specific tab is selected */}
              {activeTabFilter !== 'all' && siteContent && onUpdateSiteContent && (() => {
                const currentTab: TabId = activeTabFilter;
                const savedTabOrder = siteContent.tabSectionOrders?.[currentTab];
                const orderedBlocks = reconcileTabSectionOrder(currentTab, savedTabOrder, sections);
                const hasCustomOrder = Array.isArray(savedTabOrder) && savedTabOrder.length > 0;

                const updateTabOrder = (nextOrder: string[]) => {
                  onUpdateSiteContent('tabSectionOrders', {
                    ...(siteContent.tabSectionOrders || {}),
                    [currentTab]: nextOrder,
                  });
                };

                const resetTabOrder = () => {
                  const nextMap = { ...(siteContent.tabSectionOrders || {}) };
                  delete nextMap[currentTab];
                  onUpdateSiteContent('tabSectionOrders', nextMap);
                };

                return (
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-mono font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-red-500" />
                          <span className="capitalize">{currentTab} Tab — Unified Section Order ({orderedBlocks.length})</span>
                        </h3>
                        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Drag rows or use arrows to move any section freely. Neighboring split cards auto-align cleanly.
                        </p>
                      </div>
                      {hasCustomOrder && (
                        <button
                          type="button"
                          onClick={resetTabOrder}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="w-3 h-3 text-red-400" />
                          <span>Reset Tab Order</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {orderedBlocks.map((blockId, index) => {
                        const customId = parseCustomSectionBlockId(blockId);
                        const customSec = customId ? sections.find((s) => s.id === customId) : undefined;
                        const builtInMeta = !customId
                          ? TAB_BUILTIN_SECTIONS[currentTab].find((b) => b.id === blockId)
                          : undefined;
                        const isHidden = customSec
                          ? customSec.visible === false
                          : builtInMeta?.visibilityKey
                          ? siteContent[builtInMeta.visibilityKey] === false
                          : false;
                        const label = getSectionLabel(currentTab, blockId, sections);

                        return (
                          <div
                            key={blockId}
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedOrderId(blockId);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', blockId);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (draggedOrderId && draggedOrderId !== blockId) {
                                setDragOverOrderId(blockId);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverOrderId === blockId) setDragOverOrderId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const sourceId = draggedOrderId || e.dataTransfer.getData('text/plain');
                              if (sourceId && sourceId !== blockId) {
                                updateTabOrder(moveSectionInOrder(orderedBlocks, sourceId, blockId, 'auto'));
                              }
                              setDraggedOrderId(null);
                              setDragOverOrderId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedOrderId(null);
                              setDragOverOrderId(null);
                            }}
                            className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-grab active:cursor-grabbing ${
                              draggedOrderId === blockId
                                ? 'opacity-50 border-red-500/60 bg-zinc-900'
                                : dragOverOrderId === blockId
                                ? 'border-red-500 bg-red-950/20'
                                : isHidden
                                ? 'bg-zinc-950/40 border-dashed border-zinc-800 text-zinc-500'
                                : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span className="font-mono text-[10px] text-zinc-500 tabular-nums w-5 shrink-0">
                                #{index + 1}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 border ${
                                  customSec
                                    ? 'bg-red-950/40 border-red-800/60 text-red-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}
                              >
                                {customSec ? 'Custom' : 'Built-In'}
                              </span>
                              <span className="font-medium truncate">{label}</span>
                              {isHidden && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-500 shrink-0">
                                  Hidden
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateTabOrder(nudgeSectionInOrder(orderedBlocks, blockId, 'up'))}
                                disabled={index === 0}
                                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-25 cursor-pointer"
                                title="Move section up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTabOrder(nudgeSectionInOrder(orderedBlocks, blockId, 'down'))}
                                disabled={index === orderedBlocks.length - 1}
                                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-25 cursor-pointer"
                                title="Move section down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Built-In Sections & Sub-Sections Control (Show / Restore Removed Sections) */}
              {siteContent && onUpdateSiteContent && (
                <div className="p-4 bg-zinc-900/40 border border-zinc-800/90 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-mono font-semibold text-zinc-200 uppercase tracking-wider">
                        Built-In Page Sections &amp; Sub-Sections
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Removed blocks disappear cleanly from both Owner View and Visitor View. Restore or toggle them here.
                      </p>
                    </div>
                    {BUILTIN_SECTION_ENTRIES.some((entry) => siteContent[entry.key] === false) && (
                      <button
                        type="button"
                        onClick={() => {
                          BUILTIN_SECTION_ENTRIES.forEach((entry) => {
                            if (siteContent[entry.key] === false) {
                              onUpdateSiteContent(entry.key, true);
                            }
                          });
                        }}
                        className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/50 rounded-lg text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore All Built-In Sections</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BUILTIN_SECTION_ENTRIES.filter(
                      (entry) => activeTabFilter === 'all' || entry.tab === activeTabFilter
                    ).map((entry) => {
                      const isVisible = siteContent[entry.key] !== false;
                      return (
                        <div
                          key={String(entry.key)}
                          className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                            isVisible
                              ? 'bg-zinc-950/70 border-zinc-800 text-zinc-200'
                              : 'bg-zinc-950/40 border-dashed border-zinc-700 text-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono uppercase text-zinc-400 shrink-0">
                              {entry.tab}
                            </span>
                            <span className={`truncate ${entry.isSubSection ? 'pl-2 text-[11px] font-mono' : 'text-xs font-medium'}`}>
                              {entry.isSubSection ? `↳ ${entry.label}` : entry.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateSiteContent(entry.key, !isVisible)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                              isVisible
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-red-300'
                                : 'bg-red-600 hover:bg-red-500 border-red-500 text-white font-semibold'
                            }`}
                          >
                            {isVisible ? (
                              <>
                                <Eye className="w-3 h-3 text-red-400" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Restore</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Sections List */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                  Custom Showcase Sections ({displayedSections.length})
                </div>
                {displayedSections.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
                    No custom sections found in this tab. Click one of the "+ Add" buttons above to create one.
                  </div>
                ) : (
                  displayedSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-5 bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/60 uppercase text-[10px]">
                            {sec.tab} TAB
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400">{sec.kicker}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-500 capitalize">{sec.layout} Layout</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-500">{sec.items.length} Cards</span>
                          {sec.visible === false && (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-display font-semibold text-zinc-100">
                          {sec.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{sec.description}</p>
                      </div>

                      {/* Section Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Order buttons */}
                        <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
                          <button
                            onClick={() => handleMoveOrder(sec.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            title="Move section up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(sec.id, 'down')}
                            disabled={idx === displayedSections.length - 1}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            title="Move section down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(sec.id)}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            sec.visible !== false
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-red-400'
                              : 'bg-zinc-900 border-dashed border-zinc-700 text-zinc-500 hover:text-white'
                          }`}
                          title={sec.visible !== false ? 'Visible on page (click to hide)' : 'Hidden from page (click to restore)'}
                        >
                          {sec.visible !== false ? (
                            <Eye className="w-4 h-4 text-red-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>

                        {/* Edit Section */}
                        <button
                          onClick={() => handleStartEdit(sec)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-mono transition-colors shadow-sm cursor-pointer"
                        >
                          Edit Content
                        </button>

                        {/* Delete Section */}
                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSaveForm} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <h3 className="text-base font-display font-bold text-zinc-100">
                    {isCreatingNew ? 'Create New Editorial / Media Section' : `Edit: ${formData.title}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsCreatingNew(false);
                    setFormError(null);
                  }}
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  ← Back to Sections List
                </button>
              </div>
              {formError && (
                <div className="px-3 py-2 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300">
                  {formError}
                </div>
              )}

              {/* Starter Preset Strip (when creating new) */}
              {isCreatingNew && (
                <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Quick Editorial &amp; Media Starter Preset
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'editorial', label: 'Editorial Story + Media' },
                        { id: 'gallery', label: 'Photo / Video Gallery' },
                        { id: 'cards', label: 'Showcase Cards' },
                        { id: 'feature', label: 'Media Feature Rows' },
                        { id: 'split', label: '2-Column Split' },
                        { id: 'stats', label: 'KPI Benchmarks' },
                        { id: 'callout', label: 'Callout Banner' },
                      ] as { id: CustomSectionLayout; label: string }[]
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyCreateTemplate(preset.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                          formData.layout === preset.id
                            ? 'bg-red-600 border-red-500 text-white font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab, Layout & Direct Placement Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                    Target Tab in Header
                  </label>
                  <select
                    value={formData.tab || 'work'}
                    onChange={(e) => {
                      const nextTab = e.target.value as TabId;
                      setFormData({ ...formData, tab: nextTab });
                      setTargetSlotIndex(
                        getInitialSlotIndexForTab(
                          nextTab,
                          editingSection?.tab === nextTab ? editingSection.id : undefined,
                          sections
                        )
                      );
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="home">Home Tab (Main Feed)</option>
                    <option value="work">Work Tab (Portfolio &amp; Case Studies)</option>
                    <option value="about">About Tab (Philosophy, Stats &amp; Career)</option>
                    <option value="resume">Resume Tab (CV, Benchmarks &amp; Skills)</option>
                    <option value="contact">Contact Tab (Inquiries &amp; Connect)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                    Visual Layout
                  </label>
                  <select
                    value={formData.layout || 'editorial'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: e.target.value as CustomSectionLayout,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="editorial">Editorial Story &amp; Cover Media (Long-Form)</option>
                    <option value="gallery">Photo &amp; Video Showcase Grid</option>
                    <option value="cards">Cards Grid (3-Col with Optional Media)</option>
                    <option value="feature">Feature Rows (Side-by-Side Media &amp; Breakdown)</option>
                    <option value="split">Split Columns (2-Col Technical Topics)</option>
                    <option value="stats">Stat Cards Strip (KPI Benchmarks)</option>
                    <option value="callout">Executive Callout Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                    Placement in Tab
                  </label>
                  <select
                    value={Math.min(
                      targetSlotIndex,
                      Math.max(0, placementPreviewSlots.length - 1)
                    )}
                    onChange={(e) => setTargetSlotIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    {placementPreviewSlots.map((slot) => (
                      <option key={slot.index} value={slot.index}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section Header & Editorial Copy */}
              <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
                  <BookOpen className="w-3.5 h-3.5 text-red-500" />
                  <span>Editorial Headline, Copy &amp; Call-to-Action</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                      Section Kicker (Monospace Label)
                    </label>
                    <input
                      type="text"
                      value={formData.kicker || ''}
                      onChange={(e) => setFormData({ ...formData, kicker: e.target.value })}
                      placeholder="e.g. INDUSTRY RECOGNITION · SPOTLIGHT"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                      Section Headline / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Real-Time Lighting Talks & Masterclasses"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                    Intro Summary / Dek
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Concise summary or subheading right under the title..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                    Long-Form Editorial Article Body (Optional Multi-Paragraph Copy)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bodyContent || ''}
                    onChange={(e) => setFormData({ ...formData, bodyContent: e.target.value })}
                    placeholder="Write full editorial copy, design rationale, or production notes here. Separate paragraphs with a blank line..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase flex items-center gap-1.5">
                      <Link2 className="w-3 h-3 text-red-400" />
                      <span>Section Action Button Label (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ctaLabel || ''}
                      onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                      placeholder="e.g. Watch Full Breakdown / Read Article"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                      Section Action Button URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.ctaUrl || ''}
                      onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                      placeholder="https://... or /assets/..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section Cover Photo / Video Panel */}
              <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>Section Cover Photo or Video (Optional Hero Media)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Media Position:
                    </span>
                    {(['top', 'left', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setFormData({ ...formData, mediaPlacement: pos })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase border transition-colors cursor-pointer ${
                          (formData.mediaPlacement || 'top') === pos
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <MediaUploadField
                  value={formData.coverMediaUrl || ''}
                  onChange={(url) => setFormData({ ...formData, coverMediaUrl: url })}
                  mediaType="both"
                  aspectRatio="video"
                  label="Upload Cover Photo / MP4 Video or Paste Image / YouTube / Vimeo URL"
                  placeholder="https://... (Image, MP4, YouTube, or Vimeo URL)"
                />

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    Cover Media Caption / Credit (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.coverMediaCaption || ''}
                    onChange={(e) => setFormData({ ...formData, coverMediaCaption: e.target.value })}
                    placeholder="e.g. Fig 1.1 — Unreal Engine 5.4 volumetric lighting pass"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Items / Cards / Media Entries in this Section */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-display font-semibold text-zinc-200">
                      Cards, Media Frames &amp; Items ({formData.items?.length || 0})
                    </h4>
                    <p className="text-xs font-mono text-zinc-500">
                      Attach photos or videos, bullet highlights, titles, and links to any item
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-mono flex items-center gap-1 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Card / Media Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items?.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 relative group"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                        <div className="text-[11px] font-mono text-red-400 font-semibold">
                          Item #{idx + 1}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveFormItem(it.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-950 rounded-lg border border-zinc-800 disabled:opacity-30 cursor-pointer"
                            title="Move item up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFormItem(it.id, 'down')}
                            disabled={idx === (formData.items?.length || 1) - 1}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-950 rounded-lg border border-zinc-800 disabled:opacity-30 cursor-pointer"
                            title="Move item down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateFormItem(it)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-950 rounded-lg border border-zinc-800 cursor-pointer"
                            title="Duplicate this item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFormItem(it.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                            title="Delete this item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item Photo / Video Uploader */}
                      <div className="space-y-3">
                        <MediaUploadField
                          value={it.mediaUrl || ''}
                          onChange={(url) => handleUpdateFormItem(it.id, 'mediaUrl', url)}
                          mediaType="both"
                          aspectRatio="video"
                          label="Item Photo or Video (Optional Upload / Image / MP4 / YouTube / Vimeo)"
                          placeholder="https://... (Leave blank for text-only card)"
                        />

                        {it.mediaUrl && (
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                              Media Caption
                            </label>
                            <input
                              type="text"
                              value={it.mediaCaption || ''}
                              onChange={(e) =>
                                handleUpdateFormItem(it.id, 'mediaCaption', e.target.value)
                              }
                              placeholder="Optional caption below photo or video..."
                              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Title / Metric Value
                          </label>
                          <input
                            type="text"
                            value={it.title}
                            onChange={(e) => handleUpdateFormItem(it.id, 'title', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Tag / Badge
                          </label>
                          <input
                            type="text"
                            value={it.tag || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'tag', e.target.value)}
                            placeholder="e.g. Technical Lecture · 2024"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={it.subtitle || ''}
                          onChange={(e) => handleUpdateFormItem(it.id, 'subtitle', e.target.value)}
                          placeholder="e.g. Unreal Engine Spotlight"
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                          Description / Editorial Notes
                        </label>
                        <textarea
                          rows={2}
                          value={it.description}
                          onChange={(e) => handleUpdateFormItem(it.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                          Key Bullet Takeaways (One per line, optional)
                        </label>
                        <textarea
                          rows={2}
                          value={(it.highlights || []).join('\n')}
                          onChange={(e) =>
                            handleUpdateFormItem(
                              it.id,
                              'highlights',
                              e.target.value.split('\n')
                            )
                          }
                          placeholder={'Bullet takeaway 1\nBullet takeaway 2'}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Link Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={it.linkText || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'linkText', e.target.value)}
                            placeholder="e.g. Read Case Study"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Link URL (Optional)
                          </label>
                          <input
                            type="text"
                            value={it.linkUrl || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'linkUrl', e.target.value)}
                            placeholder="https://... or /..."
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Place Section</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

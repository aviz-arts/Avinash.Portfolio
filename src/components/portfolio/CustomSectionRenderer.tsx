import React from 'react';
import { CustomSection, CustomSectionItem } from '../../utils/portfolioStorage';
import {
  getBalancedContainerClass,
  getBalancedItemSpanClass,
} from '../../utils/layoutHelpers';
import { resolveMediaSource, sanitizeExternalLinkUrl } from '../../utils/mediaHelpers';
import { EditableText } from '../common/EditableText';
import {
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Film,
  ArrowUpRight,
} from 'lucide-react';

interface CustomSectionRendererProps {
  sections: CustomSection[];
  tab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  isOwner: boolean;
  onUpdateSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteSection?: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

interface CustomSectionCardProps {
  section: CustomSection;
  isOwner: boolean;
  onUpdateSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteSection?: (id: string) => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

const MediaDisplayFrame: React.FC<{
  url?: string;
  hint?: 'auto' | 'image' | 'video';
  caption?: string;
  alt: string;
  aspectClass?: string;
  isOwner?: boolean;
  onUpdateCaption?: (val: string) => void;
}> = ({
  url,
  hint = 'auto',
  caption,
  alt,
  aspectClass = 'aspect-video',
  isOwner = false,
  onUpdateCaption,
}) => {
  const resolved = resolveMediaSource(url, hint);
  if (!resolved) return null;

  return (
    <figure className="space-y-2 print:break-inside-avoid">
      <div
        className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-zinc-800/90 bg-black shadow-lg`}
      >
        {resolved.kind === 'youtube' || resolved.kind === 'vimeo' ? (
          <iframe
            src={resolved.src}
            title={alt}
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : resolved.kind === 'video-file' ? (
          <video
            src={resolved.src}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={resolved.src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {(caption || isOwner) && onUpdateCaption && (
        <figcaption className="text-[11px] font-mono text-zinc-500 px-1 print:text-zinc-600">
          {caption ? (
            <EditableText
              value={caption}
              onChange={onUpdateCaption}
              isOwner={isOwner}
              label="Media Caption"
            />
          ) : isOwner ? (
            <EditableText
              value=""
              onChange={onUpdateCaption}
              isOwner={isOwner}
              label="Add Caption"
              placeholder="Click to add photo/video caption..."
            />
          ) : null}
        </figcaption>
      )}
    </figure>
  );
};

export const CustomSectionCard: React.FC<CustomSectionCardProps> = ({
  section: sec,
  isOwner,
  onUpdateSection,
  onDeleteSection,
  onEditSectionClick,
}) => {
  const handleUpdateItem = (
    sectionId: string,
    itemId: string,
    key: keyof CustomSectionItem,
    value: any
  ) => {
    const updatedItems = sec.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, [key]: value };
      }
      return item;
    });
    onUpdateSection?.(sectionId, { items: updatedItems });
  };

  const handleAddItem = (sectionId: string) => {
    const newItem: CustomSectionItem = {
      id: `item-${Date.now()}`,
      title: sec.layout === 'gallery' ? 'New Visual Breakdown' : 'New Editorial Card',
      subtitle: 'Technical Focus / Engine Pass',
      description: 'Detail the workflow, visual pass, gameplay loop, or production notes here.',
      tag: sec.layout === 'gallery' ? 'Media Entry' : 'New Entry',
    };
    onUpdateSection?.(sectionId, { items: [...sec.items, newItem] });
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const updatedItems = sec.items.filter((item) => item.id !== itemId);
    onUpdateSection?.(sectionId, { items: updatedItems });
  };

  const safeSectionCtaUrl = sanitizeExternalLinkUrl(sec.ctaUrl);
  const hasCoverMedia = Boolean(sec.coverMediaUrl?.trim());
  const mediaPlacement = sec.mediaPlacement || 'top';

  const renderItemLink = (item: CustomSectionItem) => {
    if (!item.linkText) return null;
    const safeUrl = sanitizeExternalLinkUrl(item.linkUrl);
    return (
      <div className="pt-4 mt-auto border-t border-zinc-800/80 print:border-zinc-300">
        {safeUrl && !isOwner ? (
          <a
            href={safeUrl}
            target={safeUrl.startsWith('#') || safeUrl.startsWith('/') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
          >
            <span>{item.linkText}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1">
            <EditableText
              value={item.linkText}
              onChange={(v) => handleUpdateItem(sec.id, item.id, 'linkText', v)}
              isOwner={isOwner}
              label="Link Text"
            />
            {safeUrl ? (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={safeUrl}
                className="p-0.5 hover:text-white"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <ExternalLink className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    );
  };

  const renderItemHighlights = (item: CustomSectionItem) => {
    if (!Array.isArray(item.highlights) || item.highlights.length === 0) return null;
    return (
      <ul className="space-y-1.5 pt-2">
        {item.highlights.map((bullet, bIdx) => (
          <li
            key={bIdx}
            className="flex items-start gap-2 text-xs text-zinc-300 print:text-zinc-700 leading-relaxed"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderEditorialBodyAndCta = () => {
    const paragraphs = (sec.bodyContent || '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4">
        {isOwner ? (
          <div className="text-sm text-zinc-300 print:text-zinc-800 leading-relaxed text-justify whitespace-pre-line">
            <EditableText
              value={sec.bodyContent || ''}
              onChange={(val) => onUpdateSection?.(sec.id, { bodyContent: val })}
              isOwner={isOwner}
              label="Editorial Article Body"
              multiline={true}
              placeholder="Click to write full editorial body paragraphs, or open Edit Content & Media..."
              as="span"
            />
          </div>
        ) : (
          paragraphs.length > 0 && (
            <div className="space-y-3">
              {paragraphs.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 leading-relaxed font-light text-justify whitespace-pre-line"
                >
                  {para}
                </p>
              ))}
            </div>
          )
        )}

        {(sec.ctaLabel || isOwner) && (sec.ctaLabel || safeSectionCtaUrl) && (
          <div className="pt-2">
            {safeSectionCtaUrl && !isOwner ? (
              <a
                href={safeSectionCtaUrl}
                target={safeSectionCtaUrl.startsWith('#') || safeSectionCtaUrl.startsWith('/') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs transition-colors shadow-lg shadow-red-600/25 whitespace-nowrap"
              >
                <span>{sec.ctaLabel || 'Open Reference'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono">
                <EditableText
                  value={sec.ctaLabel || 'Action CTA'}
                  onChange={(v) => onUpdateSection?.(sec.id, { ctaLabel: v })}
                  isOwner={isOwner}
                  label="CTA Label"
                />
                {safeSectionCtaUrl && (
                  <a
                    href={safeSectionCtaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300"
                    title={safeSectionCtaUrl}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSectionHeader = () => (
    <div className="w-full mb-6">
      <div className="text-xs font-mono text-red-500 print:text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-red-500 print:text-red-700" />
        <EditableText
          value={sec.kicker}
          onChange={(val) => onUpdateSection?.(sec.id, { kicker: val })}
          isOwner={isOwner}
          label="Section Kicker"
        />
      </div>
      <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-100 print:text-zinc-950 tracking-tight">
        <EditableText
          value={sec.title}
          onChange={(val) => onUpdateSection?.(sec.id, { title: val })}
          isOwner={isOwner}
          label="Section Title"
          as="span"
        />
      </h3>
      {(sec.description || isOwner) && (
        <p className="text-sm text-zinc-400 print:text-zinc-700 leading-relaxed mt-2.5 text-justify">
          <EditableText
            value={sec.description}
            onChange={(val) => onUpdateSection?.(sec.id, { description: val })}
            isOwner={isOwner}
            label="Section Description"
            multiline={true}
            placeholder="Click to add a short intro summary..."
            as="span"
          />
        </p>
      )}
    </div>
  );

  return (
    <div className="relative p-6 sm:p-8 rounded-3xl border bg-zinc-900/30 border-zinc-800/80 shadow-xl transition-all print:p-5 print:rounded-xl print:bg-white print:border-zinc-300 print:shadow-none print:break-inside-avoid">
      {/* Owner Quick Controls Bar */}
      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-zinc-800/80 bg-zinc-900/60 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-4 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/60">
              Custom Section ({sec.tab.toUpperCase()} TAB)
            </span>
            <span className="text-zinc-500 capitalize">Layout: {sec.layout}</span>
            {hasCoverMedia && (
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 inline-flex items-center gap-1">
                <Film className="w-3 h-3 text-red-400" />
                <span>Cover Media</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <button
              type="button"
              onClick={() => handleAddItem(sec.id)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="Add another card or photo/video item to this section"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Add Card</span>
            </button>
            {onEditSectionClick && (
              <button
                type="button"
                onClick={() => onEditSectionClick(sec)}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-red-600/30 cursor-pointer whitespace-nowrap"
                title="Open full editorial studio: upload photos/videos, edit copy, change layout, or place in tab"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Content &amp; Media</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDeleteSection?.(sec.id)}
              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="Remove this section"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Editorial Split / Top Header & Media */}
      {sec.layout === 'editorial' && hasCoverMedia && mediaPlacement !== 'top' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-6">
          <div
            className={`lg:col-span-6 ${
              mediaPlacement === 'right' ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <MediaDisplayFrame
              url={sec.coverMediaUrl}
              hint={sec.coverMediaType}
              caption={sec.coverMediaCaption}
              alt={sec.title}
              isOwner={isOwner}
              onUpdateCaption={(val) => onUpdateSection?.(sec.id, { coverMediaCaption: val })}
            />
          </div>
          <div
            className={`lg:col-span-6 ${
              mediaPlacement === 'right' ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            {renderSectionHeader()}
            {renderEditorialBodyAndCta()}
          </div>
        </div>
      ) : (
        <>
          {sec.layout !== 'callout' && renderSectionHeader()}

          {hasCoverMedia && (
            <div className="mb-6">
              <MediaDisplayFrame
                url={sec.coverMediaUrl}
                hint={sec.coverMediaType}
                caption={sec.coverMediaCaption}
                alt={sec.title}
                aspectClass="aspect-[21/9] sm:aspect-[16/7]"
                isOwner={isOwner}
                onUpdateCaption={(val) => onUpdateSection?.(sec.id, { coverMediaCaption: val })}
              />
            </div>
          )}

          {sec.layout !== 'callout' && (sec.bodyContent || sec.ctaLabel || isOwner) && (
            <div className="mb-6">{renderEditorialBodyAndCta()}</div>
          )}
        </>
      )}

      {/* Empty state for card/media layouts */}
      {sec.items.length === 0 && sec.layout !== 'callout' && sec.layout !== 'editorial' && (
        <div className="p-6 border border-dashed border-zinc-800 rounded-2xl text-center text-xs font-mono text-zinc-500 space-y-3">
          <p>No cards or media items in this section yet.</p>
          {isOwner && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddItem(sec.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
              {onEditSectionClick && (
                <button
                  type="button"
                  onClick={() => onEditSectionClick(sec)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                  <span>Upload Photos / Videos</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gallery Layout: Media-First Photo & Video Grid */}
      {sec.layout === 'gallery' && sec.items.length > 0 && (
        <div
          className={getBalancedContainerClass(
            sec.items.length,
            sec.items.length <= 2 ? 'split' : 'cards'
          )}
        >
          {sec.items.map((item, idx) => (
            <div
              key={item.id}
              className={`${getBalancedItemSpanClass(
                idx,
                sec.items.length,
                sec.items.length <= 2 ? 'split' : 'cards'
              )} group relative p-4 sm:p-5 bg-zinc-950/75 hover:bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col gap-3 transition-all h-full print:bg-zinc-50 print:border-zinc-300`}
            >
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(sec.id, item.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-950/90 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                  title="Delete gallery item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {item.mediaUrl ? (
                <MediaDisplayFrame
                  url={item.mediaUrl}
                  hint={item.mediaType}
                  caption={item.mediaCaption}
                  alt={item.title}
                  aspectClass="aspect-video"
                  isOwner={isOwner}
                  onUpdateCaption={(val) => handleUpdateItem(sec.id, item.id, 'mediaCaption', val)}
                />
              ) : (
                isOwner &&
                onEditSectionClick && (
                  <button
                    type="button"
                    onClick={() => onEditSectionClick(sec)}
                    className="aspect-video w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-red-500/60 bg-zinc-900/40 flex flex-col items-center justify-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5 text-red-500" />
                    <span>Click to add Photo or Video</span>
                  </button>
                )
              )}

              <div className="space-y-1.5 flex-1">
                {item.tag && (
                  <div className="text-[11px] font-mono text-red-400 tracking-wide uppercase">
                    <EditableText
                      value={item.tag}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                      isOwner={isOwner}
                      label="Media Tag"
                    />
                  </div>
                )}
                <h4 className="text-base sm:text-lg font-display font-semibold text-zinc-100 print:text-zinc-950">
                  <EditableText
                    value={item.title}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                    isOwner={isOwner}
                    label="Media Title"
                    as="span"
                  />
                </h4>
                {item.subtitle && (
                  <div className="text-xs font-mono text-zinc-400">
                    <EditableText
                      value={item.subtitle}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                      isOwner={isOwner}
                      label="Media Subtitle"
                    />
                  </div>
                )}
                {item.description && (
                  <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed text-justify pt-0.5">
                    <EditableText
                      value={item.description}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                      isOwner={isOwner}
                      label="Media Notes"
                      multiline={true}
                      as="span"
                    />
                  </p>
                )}
                {renderItemHighlights(item)}
              </div>

              {renderItemLink(item)}
            </div>
          ))}
        </div>
      )}

      {/* Cards & Editorial Sub-Cards Layout */}
      {(sec.layout === 'cards' || sec.layout === 'editorial') && sec.items.length > 0 && (
        <div className={getBalancedContainerClass(sec.items.length, 'cards')}>
          {sec.items.map((item, idx) => (
            <div
              key={item.id}
              className={`${getBalancedItemSpanClass(idx, sec.items.length, 'cards')} group relative p-6 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col transition-all h-full print:bg-zinc-50 print:border-zinc-300`}
            >
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(sec.id, item.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                  title="Delete card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {item.mediaUrl && (
                <div className="mb-4">
                  <MediaDisplayFrame
                    url={item.mediaUrl}
                    hint={item.mediaType}
                    caption={item.mediaCaption}
                    alt={item.title}
                    aspectClass="aspect-video"
                    isOwner={isOwner}
                    onUpdateCaption={(val) => handleUpdateItem(sec.id, item.id, 'mediaCaption', val)}
                  />
                </div>
              )}

              <div className="space-y-3">
                {item.tag && (
                  <div className="text-xs font-mono text-red-400 tracking-wide">
                    <EditableText
                      value={item.tag}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                      isOwner={isOwner}
                      label="Card Tag"
                    />
                  </div>
                )}

                <h4 className="text-base sm:text-lg font-display font-semibold text-zinc-100 print:text-zinc-950 leading-snug">
                  <EditableText
                    value={item.title}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                    isOwner={isOwner}
                    label="Card Title"
                    as="span"
                  />
                </h4>

                {item.subtitle && (
                  <div className="text-xs font-mono text-zinc-400 print:text-zinc-600">
                    <EditableText
                      value={item.subtitle}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                      isOwner={isOwner}
                      label="Card Subtitle"
                    />
                  </div>
                )}

                <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed pt-1 text-justify">
                  <EditableText
                    value={item.description}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                    isOwner={isOwner}
                    label="Card Description"
                    multiline={true}
                    as="span"
                  />
                </p>

                {renderItemHighlights(item)}
              </div>

              {renderItemLink(item)}
            </div>
          ))}
        </div>
      )}

      {/* Split 2-Column Layout */}
      {sec.layout === 'split' && sec.items.length > 0 && (
        <div className={getBalancedContainerClass(sec.items.length, 'split')}>
          {sec.items.map((item, idx) => (
            <div
              key={item.id}
              className={`${getBalancedItemSpanClass(idx, sec.items.length, 'split')} group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col h-full`}
            >
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(sec.id, item.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {item.mediaUrl && (
                <div className="mb-4">
                  <MediaDisplayFrame
                    url={item.mediaUrl}
                    hint={item.mediaType}
                    caption={item.mediaCaption}
                    alt={item.title}
                    aspectClass="aspect-video"
                    isOwner={isOwner}
                    onUpdateCaption={(val) => handleUpdateItem(sec.id, item.id, 'mediaCaption', val)}
                  />
                </div>
              )}

              <div className="space-y-3">
                {item.tag && (
                  <div className="text-xs font-mono text-red-400 font-medium tracking-wide">
                    <EditableText
                      value={item.tag}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                      isOwner={isOwner}
                      label="Item Tag"
                    />
                  </div>
                )}
                <h4 className="text-lg font-display font-semibold text-zinc-100">
                  <EditableText
                    value={item.title}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                    isOwner={isOwner}
                    label="Item Title"
                    as="span"
                  />
                </h4>
                {item.subtitle && (
                  <div className="text-xs font-mono text-zinc-400">
                    <EditableText
                      value={item.subtitle}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                      isOwner={isOwner}
                      label="Item Subtitle"
                    />
                  </div>
                )}
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-justify">
                  <EditableText
                    value={item.description}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                    isOwner={isOwner}
                    label="Item Description"
                    multiline={true}
                    as="span"
                  />
                </p>
                {renderItemHighlights(item)}
              </div>

              {renderItemLink(item)}
            </div>
          ))}
        </div>
      )}

      {/* Full-Width Feature Rows (with optional crisp media thumbnail/video column) */}
      {sec.layout === 'feature' && (
        <div className="space-y-4">
          {sec.items.map((item) => (
            <div
              key={item.id}
              className="group relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(sec.id, item.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete feature item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {item.mediaUrl && (
                <div className="w-full lg:w-80 shrink-0">
                  <MediaDisplayFrame
                    url={item.mediaUrl}
                    hint={item.mediaType}
                    caption={item.mediaCaption}
                    alt={item.title}
                    aspectClass="aspect-video"
                    isOwner={isOwner}
                    onUpdateCaption={(val) => handleUpdateItem(sec.id, item.id, 'mediaCaption', val)}
                  />
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {item.tag && (
                    <span className="text-xs font-mono text-red-400">
                      <EditableText
                        value={item.tag}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                        isOwner={isOwner}
                        label="Feature Tag"
                      />
                    </span>
                  )}
                  {item.subtitle && (
                    <span className="text-xs font-mono text-zinc-500">
                      <EditableText
                        value={item.subtitle}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                        isOwner={isOwner}
                        label="Feature Subtitle"
                      />
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-display font-semibold text-zinc-100">
                  <EditableText
                    value={item.title}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                    isOwner={isOwner}
                    label="Feature Title"
                    as="span"
                  />
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-justify">
                  <EditableText
                    value={item.description}
                    onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                    isOwner={isOwner}
                    label="Feature Description"
                    multiline={true}
                    as="span"
                  />
                </p>
                {renderItemHighlights(item)}
              </div>

              {item.linkText && (
                <div className="shrink-0">
                  {(() => {
                    const safeUrl = sanitizeExternalLinkUrl(item.linkUrl);
                    if (safeUrl && !isOwner) {
                      return (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>{item.linkText}</span>
                          <ExternalLink className="w-3 h-3 text-red-500" />
                        </a>
                      );
                    }
                    return (
                      <span className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono inline-flex items-center gap-1.5 whitespace-nowrap">
                        <EditableText
                          value={item.linkText}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'linkText', v)}
                          isOwner={isOwner}
                          label="Button Text"
                        />
                        <ExternalLink className="w-3 h-3 text-red-500" />
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats KPI Strip Layout */}
      {sec.layout === 'stats' && (
        <div className="space-y-4">
          {sec.items.length > 0 && (
            <div className={getBalancedContainerClass(sec.items.length, 'stats')}>
              {sec.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`${getBalancedItemSpanClass(idx, sec.items.length, 'stats')} group relative p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1 transition-all hover:border-zinc-700 print:bg-zinc-50 print:border-zinc-300`}
                >
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(sec.id, item.id)}
                      className="absolute top-2.5 right-2.5 p-1 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                      title="Delete stat metric"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div
                    className={`text-2xl font-display font-extrabold ${
                      idx === 1 || item.tag?.toLowerCase().includes('red')
                        ? 'text-red-500 print:text-red-700'
                        : 'text-white print:text-zinc-950'
                    }`}
                  >
                    <EditableText
                      value={item.title}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                      isOwner={isOwner}
                      label="Stat Metric"
                      as="span"
                    />
                  </div>
                  <div className="text-xs font-mono text-zinc-500 print:text-zinc-600 leading-snug">
                    <EditableText
                      value={item.subtitle || item.description}
                      onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                      isOwner={isOwner}
                      label="Stat Label"
                      as="span"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => handleAddItem(sec.id)}
              className="text-[11px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer print:hidden"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Stat Card</span>
            </button>
          )}
        </div>
      )}

      {/* Callout / Executive Profile Banner Layout */}
      {sec.layout === 'callout' && (
        <div className="p-6 sm:p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-4 print:bg-zinc-50 print:border-zinc-300 print:p-5 print:rounded-xl">
          <div className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-semibold">
            <EditableText
              value={sec.kicker || 'EXECUTIVE PROFILE'}
              onChange={(val) => onUpdateSection?.(sec.id, { kicker: val })}
              isOwner={isOwner}
              label="Callout Kicker"
            />
          </div>
          {sec.title && (
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-100 print:text-zinc-950">
              <EditableText
                value={sec.title}
                onChange={(val) => onUpdateSection?.(sec.id, { title: val })}
                isOwner={isOwner}
                label="Callout Heading"
                as="span"
              />
            </h3>
          )}
          <p className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 font-light leading-relaxed text-justify">
            <EditableText
              value={sec.description || sec.bodyContent || sec.title}
              onChange={(val) => onUpdateSection?.(sec.id, { description: val })}
              isOwner={isOwner}
              label="Executive Narrative Copy"
              multiline={true}
              as="span"
            />
          </p>
          {(sec.bodyContent || sec.ctaLabel) && renderEditorialBodyAndCta()}
        </div>
      )}
    </div>
  );
};

export const CustomSectionAddPrompt: React.FC<{
  tab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  onAddSectionClick: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
}> = ({ tab, onAddSectionClick }) => (
  <div className="text-center py-6 border-2 border-dashed border-zinc-800 hover:border-red-500/50 rounded-2xl transition-colors print:hidden">
    <button
      onClick={() => onAddSectionClick(tab)}
      className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 rounded-xl text-xs font-mono inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
    >
      <Plus className="w-4 h-4 text-red-500" />
      <span>+ Add Editorial / Media Section in {tab.toUpperCase()} Tab</span>
    </button>
    <p className="text-[11px] font-mono text-zinc-500 mt-2">
      Build rich sections with photos, videos, editorial stories, cards, or KPIs — then drag or jump to any spot in this tab.
    </p>
  </div>
);

export const CustomSectionRenderer: React.FC<CustomSectionRendererProps> = ({
  sections,
  tab,
  isOwner,
  onUpdateSection,
  onDeleteSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  const tabSections = sections
    .filter((sec) => sec.tab === tab && sec.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (tabSections.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div className="space-y-8 mt-8 print:mt-4 print:space-y-5">
      {tabSections.map((sec) => (
        <CustomSectionCard
          key={sec.id}
          section={sec}
          isOwner={isOwner}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onEditSectionClick={onEditSectionClick}
        />
      ))}

      {isOwner && onAddSectionClick && (
        <CustomSectionAddPrompt tab={tab} onAddSectionClick={onAddSectionClick} />
      )}
    </div>
  );
};

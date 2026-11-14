import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

export interface DropTargetState {
  id: string;
  placement: 'before' | 'after';
}

export function useTabSectionDrag(
  onReorder: (sourceId: string, targetId: string, placement: 'before' | 'after') => void
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetState | null>(null);

  const handleDragStart = (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => {
    setDraggingId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
    if (cardEl && typeof e.dataTransfer.setDragImage === 'function') {
      try {
        e.dataTransfer.setDragImage(cardEl, 24, 24);
      } catch {
        // fallback to browser default drag ghost
      }
    }
  };

  const handleDragOver = (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => {
    if (!draggingId || draggingId === sectionId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    let placement: 'before' | 'after' = 'before';
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      placement = e.clientY >= midY ? 'after' : 'before';
    }
    setDropTarget((prev) =>
      prev && prev.id === sectionId && prev.placement === placement ? prev : { id: sectionId, placement }
    );
  };

  const handleDrop = (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => {
    e.preventDefault();
    const sourceId = draggingId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === sectionId) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }

    let placement: 'before' | 'after' = dropTarget?.id === sectionId ? dropTarget.placement : 'before';
    if (!dropTarget && cardEl) {
      const rect = cardEl.getBoundingClientRect();
      placement = e.clientY >= rect.top + rect.height / 2 ? 'after' : 'before';
    }

    onReorder(sourceId, sectionId, placement);
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  return {
    draggingId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

interface SectionReorderWrapperProps {
  sectionId: string;
  label: string;
  isOwner: boolean;
  positionIndex: number;
  totalCount: number;
  draggingId: string | null;
  dropTarget: DropTargetState | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToPosition: (targetIndex: number) => void;
  onDragStart: (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => void;
  onDragOver: (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => void;
  onDrop: (sectionId: string, e: React.DragEvent, cardEl?: HTMLElement | null) => void;
  onDragEnd: () => void;
  className?: string;
  barAlignment?: 'container' | 'flush';
  children: React.ReactNode;
}

export const SectionReorderWrapper: React.FC<SectionReorderWrapperProps> = ({
  sectionId,
  label,
  isOwner,
  positionIndex,
  totalCount,
  draggingId,
  dropTarget,
  onMoveUp,
  onMoveDown,
  onMoveToPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  className = '',
  barAlignment = 'flush',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const layoutTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.9 };

  if (!isOwner) {
    return (
      <motion.div layout="position" transition={layoutTransition} className={className}>
        {children}
      </motion.div>
    );
  }

  const isDragging = draggingId === sectionId;
  const activeDropPlacement = dropTarget?.id === sectionId ? dropTarget.placement : null;
  const canMoveUp = positionIndex > 0;
  const canMoveDown = positionIndex < totalCount - 1;

  return (
    <motion.div
      ref={containerRef}
      layout="position"
      transition={layoutTransition}
      onDragOver={(e) => onDragOver(sectionId, e, containerRef.current)}
      onDrop={(e) => onDrop(sectionId, e, containerRef.current)}
      className={`relative group/reorder transition-opacity duration-150 ${
        isDragging ? 'opacity-50 ring-1 ring-red-500/70 rounded-2xl' : ''
      } ${className}`}
    >
      {/* Insertion Indicator (Before) */}
      {activeDropPlacement === 'before' && (
        <div
          aria-hidden="true"
          className="print:hidden pointer-events-none absolute -top-1.5 left-2 right-2 z-40 h-1 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.85)]"
        />
      )}

      {/* Compact Owner Reorder Control Strip */}
      <div
        className={`print:hidden ${
          barAlignment === 'container'
            ? 'w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pt-3 -mb-2'
            : 'mb-2'
        } flex items-center justify-between gap-2`}
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950/92 border border-zinc-800/90 hover:border-red-500/50 text-[11px] font-mono text-zinc-300 shadow-sm transition-colors max-w-full">
          <button
            type="button"
            draggable={true}
            onDragStart={(e) => onDragStart(sectionId, e, containerRef.current)}
            onDragEnd={onDragEnd}
            aria-label={`Drag to move ${label}`}
            title="Drag anywhere in this tab to move this section"
            className="inline-flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-0.5 py-0.5 whitespace-nowrap shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-semibold text-zinc-200 truncate max-w-[180px] sm:max-w-[260px]">
              {label}
            </span>
          </button>

          <span aria-hidden="true" className="text-zinc-700">·</span>

          <select
            aria-label={`Move ${label} to position`}
            title="Jump section directly to position"
            value={positionIndex}
            onChange={(e) => onMoveToPosition(parseInt(e.target.value, 10))}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums cursor-pointer focus:outline-none focus:border-red-500 shrink-0"
          >
            {Array.from({ length: totalCount }, (_, i) => (
              <option key={i} value={i} className="bg-zinc-950 text-zinc-100">
                #{i + 1} of {totalCount}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-0.5 pl-0.5 border-l border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${label} earlier`}
              title="Move section up / left"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${label} later`}
              title="Move section down / right"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {children}

      {/* Insertion Indicator (After) */}
      {activeDropPlacement === 'after' && (
        <div
          aria-hidden="true"
          className="print:hidden pointer-events-none absolute -bottom-1.5 left-2 right-2 z-40 h-1 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.85)]"
        />
      )}
    </motion.div>
  );
};

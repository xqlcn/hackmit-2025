import { ScheduleBlock } from './types';

// Color mapping for schedule block labels using Tailwind classes
export const COLORS: Record<ScheduleBlock['label'], string> = {
  sleep: 'bg-gray-300',
  focus: 'bg-indigo-500',
  light: 'bg-slate-400',
  break: 'bg-amber-400',
  exercise: 'bg-emerald-500',
  commitment: 'bg-blue-500',
  meal: 'bg-red-500',
  social: 'bg-pink-500',
  travel: 'bg-gray-500',
  personal: 'bg-teal-500'
};

// Emoji mapping for schedule block labels
export function labelToEmoji(label: ScheduleBlock['label']): string {
  const emojiMap: Record<ScheduleBlock['label'], string> = {
    sleep: '😴',
    focus: '💡',
    light: '💤',
    break: '☕️',
    exercise: '🏃',
    commitment: '📌',
    meal: '🍽️',
    social: '👥',
    travel: '🚗',
    personal: '🧘'
  };
  return emojiMap[label] || '📅';
}

// Convert time string to minutes
export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h % 24) * 60 + (m || 0);
}

// Convert minutes to time string
export function toTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m/60).toString().padStart(2,'0');
  const mm = (m%60).toString().padStart(2,'0');
  return `${h}:${mm}`;
}

// Split a block that crosses midnight into normalized pieces
// Example: 23:00–07:00 becomes [1380–1440] + [0–420]
// Test case: splitAcrossMidnight({ start: '23:00', end: '07:00', label: 'sleep' })
//   → [{ startMin: 1380, endMin: 1440, ... }, { startMin: 0, endMin: 420, ... }]
export function splitAcrossMidnight(block: ScheduleBlock): ScheduleBlock[] {
  const startMin = toMin(block.start);
  const endMin = toMin(block.end);
  
  // If block doesn't cross midnight, return as-is
  if (endMin > startMin) {
    return [{
      ...block,
      startMin,
      endMin
    }];
  }
  
  // Block crosses midnight (endMin <= startMin), split into two pieces
  // First piece: from start to end of day (23:59:59)
  const firstPiece: ScheduleBlock & { startMin: number; endMin: number } = {
    ...block,
    start: block.start,
    end: '23:59',
    startMin,
    endMin: 1440 // End of day (24:00 = 1440 minutes)
  };
  
  // Second piece: from start of day (00:00) to original end
  const secondPiece: ScheduleBlock & { startMin: number; endMin: number } = {
    ...block,
    start: '00:00',
    end: block.end,
    startMin: 0,
    endMin
  };
  
  return [firstPiece, secondPiece];
}

// Normalize blocks by adding time properties and splitting midnight-crossing blocks
export function normalizeBlocks(blocks: ScheduleBlock[]): (ScheduleBlock & { startMin: number; endMin: number })[] {
  const normalized: (ScheduleBlock & { startMin: number; endMin: number })[] = [];
  
  for (const block of blocks) {
    const splitBlocks = splitAcrossMidnight(block);
    normalized.push(...splitBlocks);
  }
  
  // Sort by startMin
  return normalized.sort((a, b) => a.startMin - b.startMin);
}

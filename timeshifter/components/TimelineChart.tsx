'use client';

import React from 'react';
import { ScheduleBlock } from '@/lib/types';
import { COLORS, labelToEmoji, normalizeBlocks } from '@/lib/viz';

type Props = {
  blocks: ScheduleBlock[];
  startHour?: number; // default 0
  endHour?: number;   // default 24
  showLegend?: boolean; // default true
};

export default function TimelineChart({ 
  blocks, 
  startHour = 0, 
  endHour = 24, 
  showLegend = true 
}: Props) {
  const normalizedBlocks = normalizeBlocks(blocks);
  
  // Filter blocks to only show those within the time range
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const filteredBlocks = normalizedBlocks.filter(block => 
    block.startMin < endMin && block.endMin > startMin
  );

  // Time tick positions (0, 6, 12, 18, 24 hours)
  const timeTicks = [0, 6, 12, 18, 24].filter(hour => 
    hour >= startHour && hour <= endHour
  );

  // Get unique labels for legend
  const uniqueLabels = Array.from(new Set(blocks.map(block => block.label)));

  return (
    <div className="w-full">
      {/* Timeline Container */}
      <div className="relative w-full h-14 md:h-12 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {/* Time Ticks */}
        {timeTicks.map(hour => {
          const position = ((hour - startHour) / (endHour - startHour)) * 100;
          return (
            <div
              key={hour}
              className="absolute top-0 bottom-0 flex flex-col justify-end"
              style={{ left: `${position}%` }}
            >
              <div className="w-px h-full bg-gray-300"></div>
              <div className="text-xs text-gray-500 mt-1 transform -translate-x-1/2">
                {hour}:00
              </div>
            </div>
          );
        })}

        {/* Schedule Blocks */}
        {filteredBlocks.map((block, index) => {
          // Calculate position and width relative to the visible time range
          const blockStart = Math.max(block.startMin, startMin);
          const blockEnd = Math.min(block.endMin, endMin);
          const left = ((blockStart - startMin) / (endMin - startMin)) * 100;
          const width = ((blockEnd - blockStart) / (endMin - startMin)) * 100;

          // Format time for display
          const formatTime = (mins: number) => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          };

          const startTime = formatTime(block.startMin);
          const endTime = formatTime(block.endMin);
          const emoji = labelToEmoji(block.label);
          const colorClass = COLORS[block.label] || 'bg-gray-400';

          return (
            <div
              key={index}
              className={`absolute top-1 bottom-1 rounded-md shadow-sm group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${colorClass}`}
              style={{ 
                left: `${left}%`, 
                width: `${width}%`,
                minWidth: width < 2 ? '2%' : undefined // Ensure minimum width for visibility
              }}
              tabIndex={0}
              aria-label={`${startTime}–${endTime} · ${block.label}${block.rationale ? ` · ${block.rationale}` : ''}`}
            >
              {/* Block Content */}
              <div className="h-full flex items-center px-1 md:px-2 text-white">
                <span className="text-xs md:text-sm mr-1">{emoji}</span>
                <span className="text-xs md:text-sm font-medium truncate">
                  {block.label}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div className="font-semibold">{startTime}–{endTime}</div>
                <div className="capitalize">{block.label}</div>
                {block.rationale && (
                  <div className="text-xs text-gray-300 mt-1 max-w-xs">
                    {block.rationale}
                  </div>
                )}
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && uniqueLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {uniqueLabels.map(label => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${COLORS[label] || 'bg-gray-400'}`}></div>
              <span className="text-gray-600 capitalize">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

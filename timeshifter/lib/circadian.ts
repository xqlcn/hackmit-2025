import { Chronotype, ScheduleBlock, Commitment, ActivityType, DaySchedule, WeeklySchedule } from './types';

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h % 24) * 60 + (m || 0);
};

export const toTime = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m/60).toString().padStart(2,'0');
  const mm = (m%60).toString().padStart(2,'0');
  return `${h}:${mm}`;
};

// Builds a simple 24h energy curve based on chronotype
export function energyCurve(wake: string, sleep: string, type: Chronotype): number[] {
  const arr = new Array(1440).fill(0);
  const w = toMin(wake), s = toMin(sleep);

  // Example parameters per chronotype
  const params = {
    morning: { p1: 120, p2: 540, dip: 420 },
    intermediate: { p1: 180, p2: 600, dip: 480 },
    evening: { p1: 240, p2: 720, dip: 540 }
  }[type];

  const sigma = 90;
  for (let m=0; m<1440; m++) {
    const t = (m - w + 1440) % 1440;
    const peak1 = Math.exp(-((t - params.p1)**2)/(2*sigma**2));
    const peak2 = Math.exp(-((t - params.p2)**2)/(2*sigma**2));
    const dip   = -0.6*Math.exp(-((t - params.dip)**2)/(2*sigma**2));
    let e = Math.max(0, Math.min(1, 0.5*peak1 + 0.7*peak2 + dip + 0.4));
    if ((s > w ? (m>=s || m<w) : (m>=s && m<w))) e = 0; // asleep
    arr[m] = e;
  }
  return arr;
}

// Find available time slots between existing blocks
function findAvailableSlots(
  blocks: ScheduleBlock[], 
  wake: string, 
  sleep: string, 
  minDuration: number = 30
): Array<{ start: string; end: string; duration: number; energy: number }> {
  const slots: Array<{ start: string; end: string; duration: number; energy: number }> = [];
  const sortedBlocks = blocks.sort((a, b) => toMin(a.start) - toMin(b.start));
  
  let currentTime = toMin(wake);
  const sleepTime = toMin(sleep);
  
  for (const block of sortedBlocks) {
    const blockStart = toMin(block.start);
    const blockEnd = toMin(block.end);
    
    // Add slot before this block if there's enough time
    if (blockStart - currentTime >= minDuration) {
      const slotDuration = blockStart - currentTime;
      const avgEnergy = calculateAverageEnergy(currentTime, blockStart);
      slots.push({
        start: toTime(currentTime),
        end: toTime(blockStart),
        duration: slotDuration,
        energy: avgEnergy
      });
    }
    
    currentTime = Math.max(currentTime, blockEnd);
  }
  
  // Add final slot before sleep if there's enough time
  if (sleepTime - currentTime >= minDuration) {
    const slotDuration = sleepTime - currentTime;
    const avgEnergy = calculateAverageEnergy(currentTime, sleepTime);
    slots.push({
      start: toTime(currentTime),
      end: toTime(sleepTime),
      duration: slotDuration,
      energy: avgEnergy
    });
  }
  
  return slots;
}

// Calculate average energy level for a time range
function calculateAverageEnergy(startMin: number, endMin: number, energyCurve?: number[]): number {
  if (!energyCurve) return 0.5; // Default energy if no curve provided
  
  let totalEnergy = 0;
  let count = 0;
  
  for (let i = startMin; i < endMin; i++) {
    totalEnergy += energyCurve[i % 1440];
    count++;
  }
  
  return count > 0 ? totalEnergy / count : 0.5;
}

// Greedy placement of focus and exercise blocks
function placeActivityBlocks(
  slots: Array<{ start: string; end: string; duration: number; energy: number }>,
  energyCurve: number[],
  type: Chronotype
): ScheduleBlock[] {
  const activityBlocks: ScheduleBlock[] = [];
  const usedSlots = new Set<number>();
  
  // Define activity preferences based on chronotype and energy levels
  const activityPrefs = {
    morning: {
      focus: { minEnergy: 0.6, duration: 90, priority: 'high' },
      exercise: { minEnergy: 0.5, duration: 60, priority: 'medium' }
    },
    intermediate: {
      focus: { minEnergy: 0.5, duration: 90, priority: 'high' },
      exercise: { minEnergy: 0.4, duration: 45, priority: 'medium' }
    },
    evening: {
      focus: { minEnergy: 0.4, duration: 60, priority: 'medium' },
      exercise: { minEnergy: 0.5, duration: 45, priority: 'high' }
    }
  };
  
  const prefs = activityPrefs[type];
  
  // Sort slots by energy level (highest first) for greedy placement
  const sortedSlots = [...slots].sort((a, b) => b.energy - a.energy);
  
  // Place focus blocks first (higher priority)
  for (const slot of sortedSlots) {
    if (usedSlots.has(slots.indexOf(slot))) continue;
    
    if (slot.energy >= prefs.focus.minEnergy && slot.duration >= prefs.focus.duration) {
      const focusEnd = toMin(slot.start) + prefs.focus.duration;
      activityBlocks.push({
        id: `focus-${activityBlocks.length + 1}`,
        start: slot.start,
        end: toTime(focusEnd),
        label: 'focus' as ActivityType,
        title: 'Deep Focus Work',
        rationale: `High energy period (${Math.round(slot.energy * 100)}%) - optimal for focused work`,
        icon: '🧠',
        confidence: slot.energy,
        priority: prefs.focus.priority as 'high' | 'medium' | 'low' | 'critical',
        color: '#3B82F6',
        estimatedDuration: prefs.focus.duration,
        tags: ['work', 'productivity']
      });
      usedSlots.add(slots.indexOf(slot));
    }
  }
  
  // Place exercise blocks
  for (const slot of sortedSlots) {
    if (usedSlots.has(slots.indexOf(slot))) continue;
    
    if (slot.energy >= prefs.exercise.minEnergy && slot.duration >= prefs.exercise.duration) {
      const exerciseEnd = toMin(slot.start) + prefs.exercise.duration;
      activityBlocks.push({
        id: `exercise-${activityBlocks.length + 1}`,
        start: slot.start,
        end: toTime(exerciseEnd),
        label: 'exercise' as ActivityType,
        title: 'Physical Activity',
        rationale: `Good energy level (${Math.round(slot.energy * 100)}%) - ideal for exercise`,
        icon: '💪',
        confidence: slot.energy,
        priority: prefs.exercise.priority as 'high' | 'medium' | 'low' | 'critical',
        color: '#10B981',
        estimatedDuration: prefs.exercise.duration,
        tags: ['health', 'fitness']
      });
      usedSlots.add(slots.indexOf(slot));
    }
  }
  
  // Add break blocks in remaining slots
  for (const slot of sortedSlots) {
    if (usedSlots.has(slots.indexOf(slot))) continue;
    
    if (slot.duration >= 15) { // Minimum 15 minutes for breaks
      activityBlocks.push({
        id: `break-${activityBlocks.length + 1}`,
        start: slot.start,
        end: slot.end,
        label: 'break' as ActivityType,
        title: 'Rest & Recovery',
        rationale: `Low energy period (${Math.round(slot.energy * 100)}%) - time for rest`,
        icon: '☕',
        confidence: 1 - slot.energy, // Higher confidence for breaks during low energy
        priority: 'low' as 'high' | 'medium' | 'low' | 'critical',
        color: '#F59E0B',
        estimatedDuration: slot.duration,
        tags: ['rest', 'recovery']
      });
    }
  }
  
  return activityBlocks;
}

// Generates schedule blocks with greedy placement
export function buildSchedule(
  wake: string, sleep: string, type: Chronotype, commitments: Commitment[]
): ScheduleBlock[] {
  const energy = energyCurve(wake, sleep, type);
  const blocks: ScheduleBlock[] = [];
  
  // Add sleep block
  blocks.push({
    id: 'sleep-block',
    start: sleep,
    end: wake,
    label: 'sleep' as ActivityType,
    title: 'Sleep',
    rationale: 'Essential rest period for circadian rhythm',
    icon: '😴',
    confidence: 1.0,
    priority: 'critical' as 'high' | 'medium' | 'low' | 'critical',
    color: '#6366F1',
    estimatedDuration: toMin(wake) > toMin(sleep) 
      ? toMin(wake) - toMin(sleep) 
      : (1440 - toMin(sleep)) + toMin(wake),
    tags: ['rest', 'recovery']
  });
  
  // Add commitment blocks
  for (const c of commitments) {
    blocks.push({
      id: c.id || `commitment-${blocks.length}`,
      start: c.start,
      end: c.end,
      label: 'commitment' as ActivityType,
      title: c.title,
      description: c.description,
      rationale: c.rationale || 'Scheduled commitment',
      icon: c.icon || '📅',
      confidence: 1.0,
      priority: c.priority || 'medium' as 'high' | 'medium' | 'low' | 'critical',
      color: c.color || '#8B5CF6',
      estimatedDuration: toMin(c.end) - toMin(c.start),
      commitmentId: c.id,
      location: c.location,
      preparationTime: c.preparationTime,
      travelTime: c.travelTime,
      tags: c.tags || ['commitment']
    });
  }
  
  // Find available slots and place activity blocks
  const availableSlots = findAvailableSlots(blocks, wake, sleep);
  const activityBlocks = placeActivityBlocks(availableSlots, energy, type);
  
  // Combine all blocks and sort by start time
  const allBlocks = [...blocks, ...activityBlocks];
  return allBlocks.sort((a, b) => toMin(a.start) - toMin(b.start));
}

// Generate a weekly schedule
export function buildWeeklySchedule(
  wake: string, 
  sleep: string, 
  type: Chronotype, 
  commitments: Commitment[],
  weekStart?: string // YYYY-MM-DD format, defaults to current week
): WeeklySchedule {
  const startDate = weekStart ? new Date(weekStart) : getWeekStart(new Date());
  const weekEnd = new Date(startDate);
  weekEnd.setDate(startDate.getDate() + 6);
  
  const days: DaySchedule[] = [];
  
  // Generate schedule for each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Filter commitments for this specific day
    const dayCommitments = filterCommitmentsForDay(commitments, currentDate);
    
    // Generate daily schedule
    const dailySchedule = buildSchedule(wake, sleep, type, dayCommitments);
    
    // Calculate daily metrics
    const totalDuration = calculateTotalDuration(dailySchedule);
    const confidence = calculateDailyConfidence(dailySchedule);
    
    days.push({
      date: formatDate(currentDate),
      schedule: dailySchedule,
      totalDuration,
      confidence
    });
  }
  
  // Calculate overall metrics
  const overallConfidence = days.reduce((sum, day) => sum + (day.confidence || 0), 0) / days.length;
  
  return {
    weekStart: formatDate(startDate),
    weekEnd: formatDate(weekEnd),
    days,
    metadata: {
      chronotype: type,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      algorithm: 'circadian-aware-greedy-weekly',
      overallConfidence: Math.round(overallConfidence * 100) / 100
    },
    recommendations: generateWeeklyRecommendations(days, type)
  };
}

// Helper function to get the start of the current week (Monday)
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

// Helper function to filter commitments for a specific day
function filterCommitmentsForDay(commitments: Commitment[], date: Date): Commitment[] {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
  
  return commitments.filter(commitment => {
    // If commitment has recurrence, check if it applies to this day
    if (commitment.recurrence === 'daily') {
      return true;
    } else if (commitment.recurrence === 'weekly') {
      // For weekly recurrence, we could add logic to check specific days
      // For now, assume it applies to all weekdays
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (commitment.recurrence === 'monthly') {
      // For monthly recurrence, check if it's the same day of month
      // This is a simplified implementation
      return true;
    }
    
    // If no recurrence specified, assume it's a one-time commitment
    // In a real app, you'd check the actual date
    return true;
  });
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to calculate total duration of a schedule
function calculateTotalDuration(schedule: ScheduleBlock[]): number {
  return schedule.reduce((total, block) => {
    const start = toMin(block.start);
    const end = toMin(block.end);
    const duration = end > start ? end - start : (1440 - start) + end;
    return total + duration;
  }, 0);
}

// Helper function to calculate daily confidence
function calculateDailyConfidence(schedule: ScheduleBlock[]): number {
  if (schedule.length === 0) return 0;
  
  const totalConfidence = schedule.reduce((sum, block) => sum + (block.confidence || 0), 0);
  return Math.round((totalConfidence / schedule.length) * 100) / 100;
}

// Helper function to generate weekly recommendations
function generateWeeklyRecommendations(days: DaySchedule[], type: Chronotype) {
  const recommendations = {
    optimizations: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };
  
  // Analyze weekly patterns
  const avgConfidence = days.reduce((sum, day) => sum + (day.confidence || 0), 0) / days.length;
  const totalFocusBlocks = days.reduce((sum, day) => 
    sum + day.schedule.filter(block => block.label === 'focus').length, 0);
  const totalExerciseBlocks = days.reduce((sum, day) => 
    sum + day.schedule.filter(block => block.label === 'exercise').length, 0);
  
  // Weekly confidence analysis
  if (avgConfidence < 0.6) {
    recommendations.warnings.push('Overall schedule confidence is low - consider adjusting wake/sleep times');
  } else if (avgConfidence > 0.8) {
    recommendations.optimizations.push('Excellent schedule optimization for your chronotype!');
  }
  
  // Focus block analysis
  if (totalFocusBlocks < 5) {
    recommendations.suggestions.push('Consider adding more focus blocks throughout the week for better productivity');
  } else if (totalFocusBlocks > 15) {
    recommendations.warnings.push('High number of focus blocks may lead to burnout - ensure adequate breaks');
  }
  
  // Exercise analysis
  if (totalExerciseBlocks < 3) {
    recommendations.suggestions.push('Adding more exercise blocks can improve energy levels and sleep quality');
  }
  
  // Chronotype-specific weekly advice
  if (type === 'morning') {
    recommendations.optimizations.push('Morning types benefit from consistent early wake times throughout the week');
  } else if (type === 'evening') {
    recommendations.optimizations.push('Evening types should maintain consistent late sleep schedules');
  }
  
  return recommendations;
}

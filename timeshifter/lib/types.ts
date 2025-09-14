export type Chronotype = 'morning' | 'intermediate' | 'evening';

export type ActivityType = 'sleep' | 'focus' | 'light' | 'break' | 'exercise' | 'commitment' | 'meal' | 'social' | 'travel' | 'personal';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Commitment {
  id?: string;
  start: string;
  end: string;
  title: string;
  description?: string;
  location?: string;
  priority?: Priority;
  recurrence?: Recurrence;
  rationale?: string;
  icon?: string;
  color?: string;
  isFlexible?: boolean;
  estimatedDuration?: number; // in minutes
  preparationTime?: number; // in minutes
  travelTime?: number; // in minutes
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ScheduleBlock {
  id?: string;
  start: string;
  end: string;
  label: ActivityType;
  title?: string;
  description?: string;
  rationale?: string;
  icon?: string;
  confidence: number;
  priority?: Priority;
  color?: string;
  isFlexible?: boolean;
  estimatedDuration?: number; // in minutes
  bufferTime?: number; // in minutes
  dependencies?: string[]; // IDs of blocks this depends on
  tags?: string[];
  metadata?: Record<string, any>;
  // For commitment blocks
  commitmentId?: string;
  location?: string;
  preparationTime?: number;
  travelTime?: number;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD format
  schedule: ScheduleBlock[];
  totalDuration?: number; // in minutes
  confidence?: number;
}

export interface WeeklySchedule {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
  days: DaySchedule[];
  metadata?: {
    chronotype?: Chronotype;
    generatedAt?: string; // ISO timestamp
    version?: string;
    algorithm?: string;
    overallConfidence?: number; // average confidence across all days
  };
  recommendations?: {
    optimizations?: string[];
    warnings?: string[];
    suggestions?: string[];
  };
}

export interface ScheduleResponse {
  schedule: ScheduleBlock[];
  weeklySchedule?: WeeklySchedule;
  metadata?: {
    totalDuration?: number; // in minutes
    chronotype?: Chronotype;
    generatedAt?: string; // ISO timestamp
    version?: string;
    algorithm?: string;
    confidence?: number; // overall schedule confidence
  };
  recommendations?: {
    optimizations?: string[];
    warnings?: string[];
    suggestions?: string[];
  };
}

export interface TimeSlot {
  start: string;
  end: string;
  duration: number; // in minutes
  isAvailable: boolean;
  conflicts?: string[]; // IDs of conflicting commitments
}

export interface ScheduleConstraints {
  wakeTime: string;
  sleepTime: string;
  chronotype: Chronotype;
  commitments: Commitment[];
  preferences?: {
    breakDuration?: number; // in minutes
    mealTimes?: string[];
    exerciseTime?: string;
    focusBlocks?: number; // number of focus blocks per day
    bufferTime?: number; // default buffer between activities
  };
  constraints?: {
    maxWorkHours?: number;
    minBreakDuration?: number;
    noWorkAfter?: string;
    noWorkBefore?: string;
  };
}

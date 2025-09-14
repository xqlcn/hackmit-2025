export type Chronotype = 'morning' | 'intermediate' | 'evening';

export interface Commitment {
  start: string;
  end: string;
  title: string;
}

export interface ScheduleBlock {
  start: string;
  end: string;
  label: 'sleep' | 'focus' | 'light' | 'break' | 'exercise' | 'commitment';
  rationale?: string;
  icon?: string;
  confidence: number;
}

export interface ScheduleResponse {
  schedule: ScheduleBlock[];
}

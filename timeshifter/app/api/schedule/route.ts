import { NextRequest, NextResponse } from 'next/server';
import { buildSchedule, buildWeeklySchedule } from '@/lib/circadian';
import { Chronotype, Commitment, ScheduleResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { wake, sleep, chronotype, commitments, generateWeekly = false, weekStart } = body;
    
    if (!wake || !sleep || !chronotype) {
      return NextResponse.json(
        { error: 'Missing required fields: wake, sleep, chronotype' },
        { status: 400 }
      );
    }
    
    // Validate chronotype
    const validChronotypes: Chronotype[] = ['morning', 'intermediate', 'evening'];
    if (!validChronotypes.includes(chronotype)) {
      return NextResponse.json(
        { error: 'Invalid chronotype. Must be one of: morning, intermediate, evening' },
        { status: 400 }
      );
    }
    
    // Validate commitments array
    const commitmentsArray: Commitment[] = Array.isArray(commitments) ? commitments : [];
    
    // Validate each commitment
    for (const commitment of commitmentsArray) {
      if (!commitment.start || !commitment.end || !commitment.title) {
        return NextResponse.json(
          { error: 'Each commitment must have start, end, and title' },
          { status: 400 }
        );
      }
    }
    
    // Generate schedule (daily or weekly)
    let response: ScheduleResponse;
    
    if (generateWeekly) {
      // Generate weekly schedule
      const weeklySchedule = buildWeeklySchedule(wake, sleep, chronotype, commitmentsArray, weekStart);
      
      // For weekly, we'll return the first day's schedule as the main schedule
      // and include the full weekly schedule in the response
      const firstDaySchedule = weeklySchedule.days[0]?.schedule || [];
      
      response = {
        schedule: firstDaySchedule,
        weeklySchedule,
        metadata: {
          totalDuration: calculateTotalDuration(firstDaySchedule),
          chronotype,
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          algorithm: 'circadian-aware-greedy-weekly',
          confidence: weeklySchedule.metadata?.overallConfidence || 0
        },
        recommendations: weeklySchedule.recommendations
      };
    } else {
      // Generate daily schedule
      const schedule = buildSchedule(wake, sleep, chronotype, commitmentsArray);
      
      response = {
        schedule,
        metadata: {
          totalDuration: calculateTotalDuration(schedule),
          chronotype,
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          algorithm: 'circadian-aware-greedy',
          confidence: calculateOverallConfidence(schedule)
        },
        recommendations: generateRecommendations(schedule, chronotype)
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate total duration
function calculateTotalDuration(schedule: any[]): number {
  return schedule.reduce((total, block) => {
    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    const duration = end > start ? end - start : (1440 - start) + end;
    return total + duration;
  }, 0);
}

// Helper function to calculate overall confidence
function calculateOverallConfidence(schedule: any[]): number {
  if (schedule.length === 0) return 0;
  
  const totalConfidence = schedule.reduce((sum, block) => sum + (block.confidence || 0), 0);
  return Math.round((totalConfidence / schedule.length) * 100) / 100;
}

// Helper function to generate recommendations
function generateRecommendations(schedule: any[], chronotype: Chronotype) {
  const recommendations = {
    optimizations: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };
  
  // Analyze schedule for recommendations
  const focusBlocks = schedule.filter(block => block.label === 'focus');
  const exerciseBlocks = schedule.filter(block => block.label === 'exercise');
  const breakBlocks = schedule.filter(block => block.label === 'break');
  
  // Focus block recommendations
  if (focusBlocks.length === 0) {
    recommendations.suggestions.push('Consider adding focused work blocks during your peak energy hours');
  } else if (focusBlocks.length > 3) {
    recommendations.warnings.push('Multiple focus blocks may lead to mental fatigue - consider adding more breaks');
  }
  
  // Exercise recommendations
  if (exerciseBlocks.length === 0) {
    recommendations.suggestions.push('Adding exercise blocks can improve energy levels and sleep quality');
  }
  
  // Break recommendations
  if (breakBlocks.length < 2) {
    recommendations.suggestions.push('Consider adding more break periods to prevent burnout');
  }
  
  // Chronotype-specific recommendations
  if (chronotype === 'morning') {
    recommendations.optimizations.push('Morning types benefit from early focus blocks and afternoon exercise');
  } else if (chronotype === 'evening') {
    recommendations.optimizations.push('Evening types perform better with afternoon focus and morning light activities');
  }
  
  return recommendations;
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate schedules.' },
    { status: 405 }
  );
}

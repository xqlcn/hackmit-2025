'use client';

import { useState } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScheduleResponse, WeeklySchedule } from '@/lib/types';

const formSchema = z.object({
  wake: z.string().min(1, 'Wake time is required'),
  sleep: z.string().min(1, 'Sleep time is required'),
  chronotype: z.enum(['morning', 'intermediate', 'evening']),
  commitments: z.array(z.object({
    start: z.string().min(1, 'Start time is required'),
    end: z.string().min(1, 'End time is required'),
    title: z.string().min(1, 'Title is required'),
  })),
  useML: z.boolean(),
  sleep_hours: z.number().min(3).max(12).optional(),
  peak_hour: z.number().min(0).max(23).optional(),
  caffeine_pm: z.boolean().optional(),
  generateWeekly: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function DemoPage() {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wake: '07:00',
      sleep: '23:00',
      chronotype: 'intermediate',
      commitments: [],
      useML: false,
      generateWeekly: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'commitments',
  });

  const useML = methods.watch('useML');
  const chronotype = methods.watch('chronotype');
  const generateWeekly = methods.watch('generateWeekly');
  const [isLoading, setIsLoading] = useState(false);
  const [serverResp, setServerResp] = useState<ScheduleResponse | null>(null);

  const onSubmit = async (values: FormData) => {
    // Check for validation errors and focus first invalid field
    const errors = methods.formState.errors;
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const firstErrorElement = document.getElementById(firstErrorField);
      if (firstErrorElement) {
        firstErrorElement.focus();
      }
      return;
    }

    setIsLoading(true);
    setServerResp(null);
    
    try {
      let finalChronotype = values.chronotype;

      // If ML is enabled, try to predict chronotype
      if (values.useML && values.sleep_hours && values.peak_hour !== undefined) {
        try {
          const mlResponse = await fetch('http://localhost:8001/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sleep_hours: values.sleep_hours,
              peak_hour: values.peak_hour,
              caffeine_pm: values.caffeine_pm || false,
            }),
          });

          if (mlResponse.ok) {
            const mlData = await mlResponse.json();
            finalChronotype = mlData.chronotype;
          }
        } catch (error) {
          console.warn('ML service unreachable:', error);
        }
      }

      // Generate schedule
      const scheduleResponse = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wake: values.wake,
          sleep: values.sleep,
          chronotype: finalChronotype,
          commitments: values.commitments,
          generateWeekly: values.generateWeekly,
        }),
      });

      if (scheduleResponse.ok) {
        const scheduleData: ScheduleResponse = await scheduleResponse.json();
        setServerResp(scheduleData);
      } else {
        console.error('Schedule generation failed');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMorningPreset = () => {
    methods.setValue('wake', '06:00');
    methods.setValue('sleep', '22:00');
    methods.setValue('chronotype', 'morning');
  };

  const setEveningPreset = () => {
    methods.setValue('wake', '09:00');
    methods.setValue('sleep', '01:00');
    methods.setValue('chronotype', 'evening');
  };

  const getBackgroundClasses = () => {
    switch (chronotype) {
      case 'morning':
        return 'bg-gradient-to-br from-orange-100 via-yellow-100 via-amber-100 to-orange-200';
      case 'evening':
        return 'bg-gradient-to-br from-indigo-100 via-purple-100 via-slate-100 to-indigo-200';
      case 'intermediate':
      default:
        return 'bg-gradient-to-br from-blue-100 via-cyan-100 via-teal-100 to-blue-200';
    }
  };

  const getTitleGradient = () => {
    switch (chronotype) {
      case 'morning':
        return 'bg-gradient-to-r from-orange-600 to-yellow-600';
      case 'evening':
        return 'bg-gradient-to-r from-indigo-600 to-purple-600';
      case 'intermediate':
      default:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600';
    }
  };

  // Helper functions for calendar-style blocks
  const getBlockColor = (label: string) => {
    const colors = {
      sleep: '#6366F1',
      focus: '#3B82F6', 
      exercise: '#10B981',
      break: '#F59E0B',
      commitment: '#8B5CF6',
      meal: '#EF4444',
      social: '#EC4899',
      travel: '#6B7280',
      personal: '#14B8A6',
      light: '#84CC16'
    };
    return colors[label as keyof typeof colors] || '#6B7280';
  };

  const getBlockBackgroundColor = (label: string) => {
    const colors = {
      sleep: '#F0F4FF',
      focus: '#EFF6FF',
      exercise: '#ECFDF5',
      break: '#FFFBEB',
      commitment: '#F3E8FF',
      meal: '#FEF2F2',
      social: '#FDF2F8',
      travel: '#F9FAFB',
      personal: '#F0FDFA',
      light: '#F7FEE7'
    };
    return colors[label as keyof typeof colors] || '#F9FAFB';
  };

  const getDefaultTitle = (label: string) => {
    const titles = {
      sleep: 'Sleep',
      focus: 'Deep Focus Work',
      exercise: 'Physical Activity',
      break: 'Rest & Recovery',
      commitment: 'Commitment',
      meal: 'Meal Time',
      social: 'Social Activity',
      travel: 'Travel Time',
      personal: 'Personal Time',
      light: 'Light Activity'
    };
    return titles[label as keyof typeof titles] || 'Activity';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10B981'; // Green
    if (confidence >= 0.6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getDuration = (start: string, end: string) => {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    const duration = endMin > startMin ? endMin - startMin : (1440 - startMin) + endMin;
    
    if (duration < 60) {
      return `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Helper functions for weekly schedule display
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const formatDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClasses()} py-12 transition-all duration-1000 ease-in-out`}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-bold ${getTitleGradient()} bg-clip-text text-transparent mb-4 tracking-tight transition-all duration-1000 ease-in-out`}>
            Build your circadian-aware day
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Enter your sleep schedule and optional commitments. We'll generate a plan aligned to your biology.
          </p>
        </div>
        
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10">
            {/* Basics Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-500 ease-in-out">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Basics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Wake Time */}
                <div>
                  <label htmlFor="wake" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Wake Time
                  </label>
                  <input
                    {...methods.register('wake')}
                    id="wake"
                    type="time"
                    aria-invalid={methods.formState.errors.wake ? 'true' : 'false'}
                    aria-describedby={methods.formState.errors.wake ? 'wake-error' : undefined}
                    className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                  {methods.formState.errors.wake && (
                    <p id="wake-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.wake.message}</p>
                  )}
                </div>

                {/* Sleep Time */}
                <div>
                  <label htmlFor="sleep" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Sleep Time
                  </label>
                  <input
                    {...methods.register('sleep')}
                    id="sleep"
                    type="time"
                    aria-invalid={methods.formState.errors.sleep ? 'true' : 'false'}
                    aria-describedby={methods.formState.errors.sleep ? 'sleep-error' : 'sleep-help'}
                    className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                  {methods.formState.errors.sleep && (
                    <p id="sleep-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.sleep.message}</p>
                  )}
                  <p id="sleep-help" className="text-xs text-gray-500 mt-1">Crossing midnight is okay.</p>
                </div>

                {/* Chronotype */}
                <div>
                  <label htmlFor="chronotype" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Chronotype
                  </label>
                  <select
                    {...methods.register('chronotype')}
                    id="chronotype"
                    aria-invalid={methods.formState.errors.chronotype ? 'true' : 'false'}
                    aria-describedby={methods.formState.errors.chronotype ? 'chronotype-error' : 'chronotype-help'}
                    className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="morning">🌅 Morning</option>
                    <option value="intermediate">☀️ Intermediate</option>
                    <option value="evening">🌙 Evening</option>
                  </select>
                  {methods.formState.errors.chronotype && (
                    <p id="chronotype-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.chronotype.message}</p>
                  )}
                  <p id="chronotype-help" className="text-xs text-gray-500 mt-1">We'll fine-tune with ML if enabled.</p>
                </div>
              </div>
            </div>

            {/* Commitments Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-500 ease-in-out">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Commitments</h2>
                </div>
                <button
                  type="button"
                  onClick={() => append({ start: '10:00', end: '11:00', title: 'Class' })}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Commitment
                </button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-12 md:col-span-3">
                        <label htmlFor={`commitments.${index}.start`} className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                          Start Time
                        </label>
                        <input
                          {...methods.register(`commitments.${index}.start`)}
                          id={`commitments.${index}.start`}
                          type="time"
                          aria-invalid={methods.formState.errors.commitments?.[index]?.start ? 'true' : 'false'}
                          aria-describedby={methods.formState.errors.commitments?.[index]?.start ? `commitments-${index}-start-error` : undefined}
                          className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white"
                        />
                        {methods.formState.errors.commitments?.[index]?.start && (
                          <p id={`commitments-${index}-start-error`} className="mt-1 text-sm text-red-600">{methods.formState.errors.commitments[index]?.start?.message}</p>
                        )}
                      </div>
                      <div className="col-span-12 md:col-span-3">
                        <label htmlFor={`commitments.${index}.end`} className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                          End Time
                        </label>
                        <input
                          {...methods.register(`commitments.${index}.end`)}
                          id={`commitments.${index}.end`}
                          type="time"
                          aria-invalid={methods.formState.errors.commitments?.[index]?.end ? 'true' : 'false'}
                          aria-describedby={methods.formState.errors.commitments?.[index]?.end ? `commitments-${index}-end-error` : undefined}
                          className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white"
                        />
                        {methods.formState.errors.commitments?.[index]?.end && (
                          <p id={`commitments-${index}-end-error`} className="mt-1 text-sm text-red-600">{methods.formState.errors.commitments[index]?.end?.message}</p>
                        )}
                      </div>
                      <div className="col-span-12 md:col-span-5">
                        <label htmlFor={`commitments.${index}.title`} className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                          Title
                        </label>
                        <input
                          {...methods.register(`commitments.${index}.title`)}
                          id={`commitments.${index}.title`}
                          type="text"
                          placeholder="e.g., Meeting, Class, Workout"
                          aria-invalid={methods.formState.errors.commitments?.[index]?.title ? 'true' : 'false'}
                          aria-describedby={methods.formState.errors.commitments?.[index]?.title ? `commitments-${index}-title-error` : undefined}
                          className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white"
                        />
                        {methods.formState.errors.commitments?.[index]?.title && (
                          <p id={`commitments-${index}-title-error`} className="mt-1 text-sm text-red-600">{methods.formState.errors.commitments[index]?.title?.message}</p>
                        )}
                      </div>
                      <div className="col-span-12 md:col-span-1">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="w-full px-3 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                          title="Delete commitment"
                          aria-label={`Delete commitment ${index + 1}`}
                        >
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {methods.formState.errors.commitments && (
                <p className="text-sm text-red-600">Check your commitments</p>
              )}
            </div>

            {/* ML Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-500 ease-in-out">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Machine Learning</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <input
                    {...methods.register('useML')}
                    id="useML"
                    type="checkbox"
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useML" className="ml-3 block text-sm font-semibold text-gray-700">
                    Use ML to predict chronotype (PyTorch service)
                  </label>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <input
                    {...methods.register('generateWeekly')}
                    id="generateWeekly"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateWeekly" className="ml-3 block text-sm font-semibold text-gray-700">
                    Generate weekly schedule (7 days)
                  </label>
                </div>
              </div>

              {useML && (
                <>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sleep Hours */}
                    <div>
                      <label htmlFor="sleep_hours" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                        Sleep Hours
                      </label>
                      <input
                        {...methods.register('sleep_hours', { valueAsNumber: true })}
                        id="sleep_hours"
                        type="number"
                        min="3"
                        max="12"
                        step="0.5"
                        placeholder="8.5"
                        aria-invalid={methods.formState.errors.sleep_hours ? 'true' : 'false'}
                        aria-describedby={methods.formState.errors.sleep_hours ? 'sleep_hours-error' : undefined}
                        className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      />
                      {methods.formState.errors.sleep_hours && (
                        <p id="sleep_hours-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.sleep_hours.message}</p>
                      )}
                    </div>

                    {/* Peak Hour */}
                    <div>
                      <label htmlFor="peak_hour" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                        Perceived Peak Hour
                      </label>
                      <input
                        {...methods.register('peak_hour', { valueAsNumber: true })}
                        id="peak_hour"
                        type="number"
                        min="0"
                        max="23"
                        placeholder="14"
                        aria-invalid={methods.formState.errors.peak_hour ? 'true' : 'false'}
                        aria-describedby={methods.formState.errors.peak_hour ? 'peak_hour-error' : undefined}
                        className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      />
                      {methods.formState.errors.peak_hour && (
                        <p id="peak_hour-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.peak_hour.message}</p>
                      )}
                    </div>

                    {/* Caffeine PM */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 w-full">
                        <input
                          {...methods.register('caffeine_pm')}
                          id="caffeine_pm"
                          type="checkbox"
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="caffeine_pm" className="ml-3 block text-sm font-semibold text-gray-700">
                          Caffeine after 3pm
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ML Result Display Area */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        ML result will appear here (e.g., "Predicted: evening (83%)")
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Row */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-500 ease-in-out">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={setMorningPreset}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-yellow-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 flex items-center"
                  >
                    <span className="mr-2">🌅</span>
                    Morning-type preset
                  </button>
                  <button
                    type="button"
                    onClick={setEveningPreset}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center"
                  >
                    <span className="mr-2">🌙</span>
                    Evening-type preset
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate My Day
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Schedule Preview */}
        {serverResp && (
          <div className="mt-12" role="status" aria-live="polite">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">
                {serverResp.weeklySchedule ? 'Your Weekly Schedule' : 'Your Personalized Schedule'}
              </h2>
              <p className="text-gray-600">
                {serverResp.weeklySchedule ? 'Optimized for your circadian rhythm across 7 days' : 'Optimized for your circadian rhythm'}
              </p>
            </div>
            
            {serverResp.weeklySchedule ? (
              /* Weekly Schedule Display */
              <div className="space-y-6">
                {/* Weekly Overview */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Week Overview</h3>
                    <div className="text-sm text-gray-600">
                      {formatDateRange(serverResp.weeklySchedule.weekStart, serverResp.weeklySchedule.weekEnd)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium">Overall Confidence</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {Math.round((serverResp.weeklySchedule.metadata?.overallConfidence || 0) * 100)}%
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Total Focus Blocks</div>
                      <div className="text-2xl font-bold text-green-900">
                        {serverResp.weeklySchedule.days.reduce((sum, day) => 
                          sum + day.schedule.filter(block => block.label === 'focus').length, 0)}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium">Exercise Sessions</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {serverResp.weeklySchedule.days.reduce((sum, day) => 
                          sum + day.schedule.filter(block => block.label === 'exercise').length, 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Schedules */}
                <div className="space-y-4">
                  {serverResp.weeklySchedule.days.map((day, dayIndex) => (
                    <div key={day.date} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {formatDayName(day.date)} - {formatDate(day.date)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Confidence: {Math.round((day.confidence || 0) * 100)}%</span>
                          <span>Duration: {formatDuration(day.totalDuration || 0)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {day.schedule.map((block, blockIndex) => (
                          <div key={blockIndex} className="relative">
                            <div 
                              className="flex items-center p-3 rounded-lg border-l-4 hover:shadow-sm transition-shadow duration-200 cursor-pointer"
                              style={{
                                borderLeftColor: getBlockColor(block.label),
                                backgroundColor: getBlockBackgroundColor(block.label)
                              }}
                            >
                              {/* Time column */}
                              <div className="w-20 flex-shrink-0 text-right pr-3">
                                <div className="text-sm font-semibold text-gray-900">
                                  {block.start}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {block.end}
                                </div>
                              </div>
                              
                              {/* Event content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                                    {block.title || getDefaultTitle(block.label)}
                                  </h4>
                                  {block.confidence && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
                                          style={{ backgroundColor: getConfidenceColor(block.confidence), color: 'white' }}>
                                      {Math.round(block.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                                
                                {block.rationale && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {block.rationale}
                                  </p>
                                )}
                              </div>
                              
                              {/* Duration indicator */}
                              <div className="flex-shrink-0 ml-3">
                                <div className="text-xs text-gray-500 text-right">
                                  {getDuration(block.start, block.end)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Daily Schedule Display */
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="space-y-2">
                  {serverResp.schedule.map((block, index) => (
                    <div key={index} className="relative">
                      {/* Calendar-style block */}
                      <div 
                        className="flex items-center p-3 rounded-lg border-l-4 hover:shadow-sm transition-shadow duration-200 cursor-pointer"
                        style={{
                          borderLeftColor: getBlockColor(block.label),
                          backgroundColor: getBlockBackgroundColor(block.label)
                        }}
                      >
                        {/* Time column */}
                        <div className="w-20 flex-shrink-0 text-right pr-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {block.start}
                          </div>
                          <div className="text-xs text-gray-500">
                            {block.end}
                          </div>
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {block.title || getDefaultTitle(block.label)}
                            </h3>
                            {block.confidence && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
                                    style={{ backgroundColor: getConfidenceColor(block.confidence), color: 'white' }}>
                                {Math.round(block.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          
                          {block.rationale && (
                            <p className="text-xs text-gray-600 truncate">
                              {block.rationale}
                            </p>
                          )}
                          
                          {/* Tags */}
                          {block.tags && block.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {block.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Duration indicator */}
                        <div className="flex-shrink-0 ml-3">
                          <div className="text-xs text-gray-500 text-right">
                            {getDuration(block.start, block.end)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

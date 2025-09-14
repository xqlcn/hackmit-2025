'use client';

import { useState } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScheduleResponse } from '@/lib/types';

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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'commitments',
  });

  const useML = methods.watch('useML');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Build your circadian-aware day</h1>
        <p className="text-lg text-gray-600 mb-8">
          Enter your sleep schedule and optional commitments. We'll generate a plan aligned to your biology.
        </p>
        
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basics Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Basics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Wake Time */}
                <div>
                  <label htmlFor="wake" className="block text-sm font-medium text-gray-700 mb-2">
                    Wake Time
                  </label>
                  <input
                    {...methods.register('wake')}
                    id="wake"
                    type="time"
                    aria-invalid={methods.formState.errors.wake ? 'true' : 'false'}
                    aria-describedby={methods.formState.errors.wake ? 'wake-error' : undefined}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {methods.formState.errors.wake && (
                    <p id="wake-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.wake.message}</p>
                  )}
                </div>

                {/* Sleep Time */}
                <div>
                  <label htmlFor="sleep" className="block text-sm font-medium text-gray-700 mb-2">
                    Sleep Time
                  </label>
                  <input
                    {...methods.register('sleep')}
                    id="sleep"
                    type="time"
                    aria-invalid={methods.formState.errors.sleep ? 'true' : 'false'}
                    aria-describedby={methods.formState.errors.sleep ? 'sleep-error' : 'sleep-help'}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {methods.formState.errors.sleep && (
                    <p id="sleep-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.sleep.message}</p>
                  )}
                  <p id="sleep-help" className="text-xs text-gray-500 mt-1">Crossing midnight is okay.</p>
                </div>

                {/* Chronotype */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-2">
                      Chronotype
                    </legend>
                    <div className="space-y-2" role="radiogroup" aria-invalid={methods.formState.errors.chronotype ? 'true' : 'false'} aria-describedby={methods.formState.errors.chronotype ? 'chronotype-error' : 'chronotype-help'}>
                      {[
                        { value: 'morning', label: 'Morning' },
                        { value: 'intermediate', label: 'Intermediate' },
                        { value: 'evening', label: 'Evening' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            {...methods.register('chronotype')}
                            type="radio"
                            value={option.value}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {methods.formState.errors.chronotype && (
                      <p id="chronotype-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.chronotype.message}</p>
                    )}
                    <p id="chronotype-help" className="text-xs text-gray-500 mt-1">We'll fine-tune with ML if enabled.</p>
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Commitments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Commitments</h2>
                <button
                  type="button"
                  onClick={() => append({ start: '10:00', end: '11:00', title: 'Class' })}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm font-medium"
                >
                  + Add
                </button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-3">
                    <label htmlFor={`commitments.${index}.start`} className="block text-xs font-medium text-gray-600 mb-1">
                      Start
                    </label>
                    <input
                      {...methods.register(`commitments.${index}.start`)}
                      id={`commitments.${index}.start`}
                      type="time"
                      aria-invalid={methods.formState.errors.commitments?.[index]?.start ? 'true' : 'false'}
                      aria-describedby={methods.formState.errors.commitments?.[index]?.start ? `commitments-${index}-start-error` : undefined}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    {methods.formState.errors.commitments?.[index]?.start && (
                      <p id={`commitments-${index}-start-error`} className="mt-1 text-xs text-red-600">{methods.formState.errors.commitments[index]?.start?.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label htmlFor={`commitments.${index}.end`} className="block text-xs font-medium text-gray-600 mb-1">
                      End
                    </label>
                    <input
                      {...methods.register(`commitments.${index}.end`)}
                      id={`commitments.${index}.end`}
                      type="time"
                      aria-invalid={methods.formState.errors.commitments?.[index]?.end ? 'true' : 'false'}
                      aria-describedby={methods.formState.errors.commitments?.[index]?.end ? `commitments-${index}-end-error` : undefined}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    {methods.formState.errors.commitments?.[index]?.end && (
                      <p id={`commitments-${index}-end-error`} className="mt-1 text-xs text-red-600">{methods.formState.errors.commitments[index]?.end?.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-5">
                    <label htmlFor={`commitments.${index}.title`} className="block text-xs font-medium text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      {...methods.register(`commitments.${index}.title`)}
                      id={`commitments.${index}.title`}
                      type="text"
                      aria-invalid={methods.formState.errors.commitments?.[index]?.title ? 'true' : 'false'}
                      aria-describedby={methods.formState.errors.commitments?.[index]?.title ? `commitments-${index}-title-error` : undefined}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    {methods.formState.errors.commitments?.[index]?.title && (
                      <p id={`commitments-${index}-title-error`} className="mt-1 text-xs text-red-600">{methods.formState.errors.commitments[index]?.title?.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="w-full px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete commitment"
                      aria-label={`Delete commitment ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              {methods.formState.errors.commitments && (
                <p className="text-sm text-red-600">Check your commitments</p>
              )}
            </div>

            {/* ML Section */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center">
                <input
                  {...methods.register('useML')}
                  id="useML"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="useML" className="ml-2 block text-sm font-medium text-gray-700">
                  Use ML to predict chronotype (PyTorch service)
                </label>
              </div>

              {useML && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sleep Hours */}
                    <div>
                      <label htmlFor="sleep_hours" className="block text-sm font-medium text-gray-700 mb-2">
                        Sleep Hours
                      </label>
                      <input
                        {...methods.register('sleep_hours', { valueAsNumber: true })}
                        id="sleep_hours"
                        type="number"
                        min="3"
                        max="12"
                        step="0.5"
                        aria-invalid={methods.formState.errors.sleep_hours ? 'true' : 'false'}
                        aria-describedby={methods.formState.errors.sleep_hours ? 'sleep_hours-error' : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {methods.formState.errors.sleep_hours && (
                        <p id="sleep_hours-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.sleep_hours.message}</p>
                      )}
                    </div>

                    {/* Peak Hour */}
                    <div>
                      <label htmlFor="peak_hour" className="block text-sm font-medium text-gray-700 mb-2">
                        Perceived Peak Hour
                      </label>
                      <input
                        {...methods.register('peak_hour', { valueAsNumber: true })}
                        id="peak_hour"
                        type="number"
                        min="0"
                        max="23"
                        aria-invalid={methods.formState.errors.peak_hour ? 'true' : 'false'}
                        aria-describedby={methods.formState.errors.peak_hour ? 'peak_hour-error' : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {methods.formState.errors.peak_hour && (
                        <p id="peak_hour-error" className="mt-1 text-sm text-red-600">{methods.formState.errors.peak_hour.message}</p>
                      )}
                    </div>

                    {/* Caffeine PM */}
                    <div className="flex items-center">
                      <input
                        {...methods.register('caffeine_pm')}
                        id="caffeine_pm"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="caffeine_pm" className="ml-2 block text-sm font-medium text-gray-700">
                        Caffeine after 3pm
                      </label>
                    </div>
                  </div>

                  {/* ML Result Display Area */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-600 italic">
                      ML result will appear here (e.g., "Predicted: evening (83%)")
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Row */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={setMorningPreset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Morning-type preset
              </button>
              <button
                type="button"
                onClick={setEveningPreset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Evening-type preset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating…' : 'Generate My Day'}
              </button>
            </div>
          </form>
        </FormProvider>

        {/* Schedule Preview */}
        {serverResp && (
          <div className="mt-8" role="status" aria-live="polite">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Schedule</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-3">
                {serverResp.schedule.map((block, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {block.start}–{block.end}
                      </span>
                      <span className="mx-2 text-gray-500">·</span>
                      <span className="text-gray-700 capitalize">{block.label}</span>
                      {block.rationale && (
                        <>
                          <span className="mx-2 text-gray-500">·</span>
                          <span className="text-gray-600 text-sm">{block.rationale}</span>
                        </>
                      )}
                    </div>
                    {block.confidence && (
                      <div className="text-xs text-gray-500 ml-4">
                        {Math.round(block.confidence * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common';
import { getPipelines } from '@/api/crm';
import { getContacts, getCompanies } from '@/api/contacts';
import type { Deal } from '@/types/crm';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  pipeline: z.number({ required_error: 'Pipeline is required' }),
  stage: z.number({ required_error: 'Stage is required' }),
  contact: z.number().nullable().optional(),
  company: z.number().nullable().optional(),
  expected_revenue: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_closing: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  defaultPipelineId?: number;
  defaultStageId?: number;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export function DealForm({
  deal,
  defaultPipelineId,
  defaultStageId,
  onSubmit,
  onCancel,
  loading,
}: DealFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: deal?.name ?? '',
      pipeline: deal?.pipeline ?? defaultPipelineId ?? 0,
      stage: deal?.stage ?? defaultStageId ?? 0,
      contact: deal?.contact ?? null,
      company: deal?.company ?? null,
      expected_revenue: deal?.expected_revenue ?? '',
      probability: deal?.probability ?? 10,
      expected_closing: deal?.expected_closing ?? '',
      priority: deal?.priority ?? 'medium',
      notes: deal?.notes ?? '',
    },
  });

  const selectedPipeline = watch('pipeline');

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: () => getContacts({ page_size: 200 }),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => getCompanies({ page_size: 200 }),
  });

  // Filter stages for the selected pipeline
  const currentPipeline = pipelines.find((p) => p.id === selectedPipeline);
  const stages = currentPipeline?.stages
    ? [...currentPipeline.stages].sort((a, b) => a.order - b.order)
    : [];

  // When pipeline changes, reset stage to first available
  useEffect(() => {
    if (stages.length > 0 && !deal) {
      const currentStage = watch('stage');
      const stageExists = stages.some((s) => s.id === currentStage);
      if (!stageExists) {
        setValue('stage', stages[0].id);
      }
    }
  }, [selectedPipeline, stages, deal, setValue, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelClass}>Deal Name *</label>
        <input {...register('name')} className={inputClass} placeholder="e.g. Acme Corp Renewal" />
        {errors.name && (
          <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>
        )}
      </div>

      {/* Pipeline + Stage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Pipeline *</label>
          <select
            className={inputClass}
            value={selectedPipeline || ''}
            onChange={(e) => setValue('pipeline', Number(e.target.value))}
          >
            <option value="" disabled>Select pipeline</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.pipeline && (
            <p className="mt-1 text-xs text-danger-600">{errors.pipeline.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Stage *</label>
          <select
            className={inputClass}
            value={watch('stage') || ''}
            onChange={(e) => setValue('stage', Number(e.target.value))}
          >
            <option value="" disabled>Select stage</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.stage && (
            <p className="mt-1 text-xs text-danger-600">{errors.stage.message}</p>
          )}
        </div>
      </div>

      {/* Contact + Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Contact</label>
          <select
            className={inputClass}
            value={watch('contact') ?? ''}
            onChange={(e) =>
              setValue('contact', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">-- None --</option>
            {contactsData?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <select
            className={inputClass}
            value={watch('company') ?? ''}
            onChange={(e) =>
              setValue('company', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">-- None --</option>
            {companiesData?.results.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount + Probability */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Expected Revenue</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              {...register('expected_revenue')}
              type="number"
              step="0.01"
              min="0"
              className={inputClass + ' pl-7'}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Probability (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            {...register('probability', { valueAsNumber: true })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Close date + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Expected Close Date</label>
          <input
            type="date"
            {...register('expected_closing')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select
            className={inputClass}
            {...register('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className={inputClass}
          placeholder="Additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {deal ? 'Save Changes' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}

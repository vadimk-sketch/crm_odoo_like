import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common';
import { getTeams } from '@/api/helpdesk';
import { getContacts } from '@/api/contacts';

const ticketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  team: z.number({ required_error: 'Team is required' }),
  stage: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  contact: z.number().nullable().optional(),
  ticket_type: z.enum(['question', 'incident', 'problem', 'feature_request']),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  initialValues?: Partial<TicketFormValues>;
  onSubmit: (data: TicketFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const inputClass =
  'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const errorClass = 'mt-1 text-xs text-danger-600';

export function TicketForm({ initialValues, onSubmit, onCancel, loading }: TicketFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'medium',
      ticket_type: 'question',
      contact: null,
      ...initialValues,
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', { page_size: 100 }],
    queryFn: () => getContacts({ page_size: 100 }),
  });

  const selectedTeamId = watch('team');

  // Auto-select first stage when team changes
  useEffect(() => {
    if (selectedTeamId) {
      const team = teams.find((t) => t.id === selectedTeamId);
      if (team && team.stages.length > 0) {
        const sorted = [...team.stages].sort((a, b) => a.order - b.order);
        setValue('stage', sorted[0].id);
      }
    }
  }, [selectedTeamId, teams, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Subject */}
      <div>
        <label className={labelClass}>Subject</label>
        <input {...register('subject')} className={inputClass} placeholder="Brief description of the issue" />
        {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          className={inputClass}
          rows={4}
          placeholder="Provide details about the ticket..."
        />
      </div>

      {/* Team + Priority row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Team</label>
          <select
            {...register('team', { valueAsNumber: true })}
            className={inputClass}
          >
            <option value="">Select team...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.team && <p className={errorClass}>{errors.team.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select {...register('priority')} className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Type + Contact row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type</label>
          <select {...register('ticket_type')} className={inputClass}>
            <option value="question">Question</option>
            <option value="incident">Incident</option>
            <option value="problem">Problem</option>
            <option value="feature_request">Feature Request</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Contact</label>
          <select
            {...register('contact', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
            className={inputClass}
          >
            <option value="">None</option>
            {contactsData?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialValues?.subject ? 'Update Ticket' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}

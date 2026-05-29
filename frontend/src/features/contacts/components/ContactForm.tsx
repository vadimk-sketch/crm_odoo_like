import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common';
import { getCompanies } from '@/api/contacts';
import type { Contact } from '@/types/contact';

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  job_title: z.string().optional(),
  company_id: z.number().nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export function ContactForm({ contact, onSubmit, onCancel, loading }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name ?? '',
      last_name: contact?.last_name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      mobile: contact?.mobile ?? '',
      job_title: contact?.job_title ?? '',
      company_id: contact?.company_id ?? null,
      address: contact?.address ?? '',
      city: contact?.city ?? '',
      state: contact?.state ?? '',
      country: contact?.country ?? '',
      zip_code: contact?.zip_code ?? '',
    },
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => getCompanies({ page_size: 200 }),
  });

  const companyId = watch('company_id');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First Name *</label>
          <input {...register('first_name')} className={inputClass} />
          {errors.first_name && (
            <p className="mt-1 text-xs text-danger-600">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input {...register('last_name')} className={inputClass} />
          {errors.last_name && (
            <p className="mt-1 text-xs text-danger-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" {...register('email')} className={inputClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register('phone')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Mobile</label>
          <input {...register('mobile')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Job Title</label>
          <input {...register('job_title')} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Company</label>
        <select
          className={inputClass}
          value={companyId ?? ''}
          onChange={(e) => setValue('company_id', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- None --</option>
          {companiesData?.results.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input {...register('address')} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input {...register('city')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input {...register('state')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Country</label>
          <input {...register('country')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Zip Code</label>
          <input {...register('zip_code')} className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {contact ? 'Save Changes' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}

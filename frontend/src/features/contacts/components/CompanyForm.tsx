import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/common';
import type { Company } from '@/types/contact';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export function CompanyForm({ company, onSubmit, onCancel, loading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? '',
      website: company?.website ?? '',
      industry: company?.industry ?? '',
      phone: company?.phone ?? '',
      email: company?.email ?? '',
      address: company?.address ?? '',
      city: company?.city ?? '',
      state: company?.state ?? '',
      country: company?.country ?? '',
      zip_code: company?.zip_code ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Company Name *</label>
        <input {...register('name')} className={inputClass} />
        {errors.name && (
          <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Website</label>
          <input {...register('website')} placeholder="https://example.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Industry</label>
          <input {...register('industry')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register('phone')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" {...register('email')} className={inputClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
          )}
        </div>
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
          {company ? 'Save Changes' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Calendar,
  Tag,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Button,
  Badge,
  LoadingSpinner,
  Modal,
  ConfirmDialog,
  Table,
} from '@/components/common';
import type { Column } from '@/components/common';
import { getCompany, updateCompany, deleteCompany } from '@/api/contacts';
import { CompanyForm, type CompanyFormData } from './components/CompanyForm';
import { NoteList } from './components/NoteList';
import type { Contact, Note } from '@/types/contact';
import client from '@/api/client';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = Number(id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => getCompany(companyId),
    enabled: !!id,
  });

  const { data: companyContacts = [] } = useQuery<Contact[]>({
    queryKey: ['company', companyId, 'contacts'],
    queryFn: async () => {
      const { data } = await client.get('/contacts/contacts/', {
        params: { company_id: companyId, page_size: 100 },
      });
      return data.results ?? data;
    },
    enabled: !!id,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['company', companyId, 'notes'],
    queryFn: async () => {
      const { data } = await client.get(`/contacts/companies/${companyId}/notes/`);
      return data.results ?? data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: CompanyFormData) => updateCompany(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated');
      setShowEditModal(false);
    },
    onError: () => toast.error('Failed to update company'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
      navigate('/companies');
    },
    onError: () => toast.error('Failed to delete company'),
  });

  const addNoteMutation = useMutation({
    mutationFn: (body: string) =>
      client.post(`/contacts/companies/${companyId}/notes/`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId, 'notes'] });
      toast.success('Note added');
    },
    onError: () => toast.error('Failed to add note'),
  });

  const contactColumns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <span className="font-medium text-gray-900">
          {c.first_name} {c.last_name}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'job_title', header: 'Title' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-12 text-center text-gray-500">Company not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          to="/companies"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {company.website && (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <Globe className="h-3.5 w-3.5" /> {company.website}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Company Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Name" value={company.name} />
          <InfoField label="Website" value={company.website} />
          <InfoField label="Industry" value={company.industry} />
          <InfoField label="Phone" value={company.phone} />
          <InfoField label="Email" value={company.email} />
          <InfoField label="Address" value={company.address} />
          <InfoField label="City" value={company.city} />
          <InfoField label="State" value={company.state} />
          <InfoField label="Country" value={company.country} />
          <InfoField label="Zip Code" value={company.zip_code} />
        </div>

        <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Created {format(parseISO(company.created_at), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Updated {format(parseISO(company.updated_at), 'MMM d, yyyy')}
          </span>
          {company.tags.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {company.tags.map((t) => (
                <Badge key={t.id} size="sm">{t.name}</Badge>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Contacts at company */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Contacts ({companyContacts.length})
        </h2>
        <Table<Contact>
          columns={contactColumns}
          data={companyContacts}
          onRowClick={(c) => navigate(`/contacts/${c.id}`)}
          emptyMessage="No contacts at this company"
        />
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
        <NoteList
          notes={notes}
          onAdd={(body) => addNoteMutation.mutate(body)}
          adding={addNoteMutation.isPending}
        />
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Company"
        size="lg"
      >
        <CompanyForm
          company={company}
          onSubmit={(d) => updateMutation.mutate(d)}
          onCancel={() => setShowEditModal(false)}
          loading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Company"
        message={`Are you sure you want to delete ${company.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || '--'}</dd>
    </div>
  );
}

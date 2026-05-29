import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  User,
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
} from '@/components/common';
import { getContact, updateContact, deleteContact } from '@/api/contacts';
import { ContactForm, type ContactFormData } from './components/ContactForm';
import { ActivityTimeline } from './components/ActivityTimeline';
import { NoteList } from './components/NoteList';
import type { Note, Activity } from '@/types/contact';
import client from '@/api/client';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contactId = Number(id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => getContact(contactId),
    enabled: !!id,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['contact', contactId, 'notes'],
    queryFn: async () => {
      const { data } = await client.get(`/contacts/contacts/${contactId}/notes/`);
      return data.results ?? data;
    },
    enabled: !!id,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['contact', contactId, 'activities'],
    queryFn: async () => {
      const { data } = await client.get(`/contacts/contacts/${contactId}/activities/`);
      return data.results ?? data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ContactFormData) => updateContact(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
      setShowEditModal(false);
    },
    onError: () => toast.error('Failed to update contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
      navigate('/contacts');
    },
    onError: () => toast.error('Failed to delete contact'),
  });

  const addNoteMutation = useMutation({
    mutationFn: (body: string) =>
      client.post(`/contacts/contacts/${contactId}/notes/`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'notes'] });
      toast.success('Note added');
    },
    onError: () => toast.error('Failed to add note'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-12 text-center text-gray-500">Contact not found.</div>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          to="/contacts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            {contact.email && (
              <p className="text-sm text-gray-500">{contact.email}</p>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact info card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoField label="First Name" value={contact.first_name} />
              <InfoField label="Last Name" value={contact.last_name} />
              <InfoField label="Email" value={contact.email} />
              <InfoField label="Phone" value={contact.phone} />
              <InfoField label="Mobile" value={contact.mobile} />
              <InfoField label="Job Title" value={contact.job_title} />
              <InfoField label="Address" value={contact.address} />
              <InfoField label="City" value={contact.city} />
              <InfoField label="State" value={contact.state} />
              <InfoField label="Country" value={contact.country} />
              <InfoField label="Zip Code" value={contact.zip_code} />
            </div>
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

          {/* Activities */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Activities</h2>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-6">
          {/* Company */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Building2 className="h-4 w-4" /> Company
            </h3>
            {contact.company ? (
              <Link
                to={`/companies/${contact.company.id}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {contact.company.name}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">No company</p>
            )}
          </div>

          {/* Owner */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <User className="h-4 w-4" /> Owner
            </h3>
            <p className="text-sm text-gray-700">--</p>
          </div>

          {/* Tags */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Tag className="h-4 w-4" /> Tags
            </h3>
            {contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((t) => (
                  <Badge key={t.id} size="sm">{t.name}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No tags</p>
            )}
          </div>

          {/* Dates */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Calendar className="h-4 w-4" /> Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {format(parseISO(contact.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-700">
                  {format(parseISO(contact.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Contact"
        size="lg"
      >
        <ContactForm
          contact={contact}
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
        title="Delete Contact"
        message={`Are you sure you want to delete ${fullName}? This action cannot be undone.`}
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

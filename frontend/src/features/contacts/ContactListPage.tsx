import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  SearchInput,
  Table,
  Pagination,
  Modal,
  ConfirmDialog,
  Badge,
  EmptyState,
} from '@/components/common';
import type { Column } from '@/components/common';
import { getContacts, createContact, deleteContact } from '@/api/contacts';
import { usePagination } from '@/hooks/usePagination';
import { ContactForm } from './components/ContactForm';
import type { Contact } from '@/types/contact';
import { format, parseISO } from 'date-fns';

export default function ContactListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, page, pageSize }],
    queryFn: () => getContacts({ search, page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Failed to create contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete contact'),
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setPage],
  );

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (c) => (
        <span className="font-medium text-gray-900">
          {c.first_name} {c.last_name}
        </span>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    {
      key: 'company',
      header: 'Company',
      render: (c) => c.company?.name ?? <span className="text-gray-400">--</span>,
    },
    { key: 'job_title', header: 'Title' },
    {
      key: 'tags',
      header: 'Tags',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <Badge key={t.id} size="sm">{t.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (c) => format(parseISO(c.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(c);
          }}
          className="rounded p-1 text-gray-400 hover:bg-danger-50 hover:text-danger-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search contacts..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {/* Table */}
      {!isLoading && data && data.results.length === 0 && !search ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No contacts yet"
          description="Get started by adding your first contact."
          actionLabel="Add Contact"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <Table<Contact>
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          onRowClick={(c) => navigate(`/contacts/${c.id}`)}
          emptyMessage="No contacts match your search"
        />
      )}

      {/* Pagination */}
      {data && data.count > pageSize && (
        <Pagination
          page={page}
          totalCount={data.count}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Contact"
        size="lg"
      >
        <ContactForm
          onSubmit={(d) => createMutation.mutate(d)}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

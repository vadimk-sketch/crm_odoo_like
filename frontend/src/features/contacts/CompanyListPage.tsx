import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  SearchInput,
  Table,
  Pagination,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '@/components/common';
import type { Column } from '@/components/common';
import { getCompanies, createCompany, deleteCompany } from '@/api/contacts';
import { usePagination } from '@/hooks/usePagination';
import { CompanyForm } from './components/CompanyForm';
import type { Company } from '@/types/contact';
import { format, parseISO } from 'date-fns';

export default function CompanyListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, page, pageSize }],
    queryFn: () => getCompanies({ search, page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Failed to create company'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete company'),
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setPage],
  );

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (c) => <span className="font-medium text-gray-900">{c.name}</span>,
    },
    {
      key: 'website',
      header: 'Domain',
      render: (c) =>
        c.website ? (
          <span className="text-primary-600">{c.website}</span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    { key: 'industry', header: 'Industry', sortable: true },
    { key: 'phone', header: 'Phone' },
    {
      key: 'email',
      header: 'Email',
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Add Company
        </Button>
      </div>

      <SearchInput
        placeholder="Search companies..."
        onChange={handleSearch}
        className="max-w-sm"
      />

      {!isLoading && data && data.results.length === 0 && !search ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No companies yet"
          description="Get started by adding your first company."
          actionLabel="Add Company"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <Table<Company>
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          onRowClick={(c) => navigate(`/companies/${c.id}`)}
          emptyMessage="No companies match your search"
        />
      )}

      {data && data.count > pageSize && (
        <Pagination
          page={page}
          totalCount={data.count}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Company"
        size="lg"
      >
        <CompanyForm
          onSubmit={(d) => createMutation.mutate(d)}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Company"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

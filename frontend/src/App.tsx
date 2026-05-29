import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const MainLayout = React.lazy(() => import('@/layouts/MainLayout'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const ContactListPage = React.lazy(() => import('@/pages/contacts/ContactListPage'));
const ContactDetailPage = React.lazy(() => import('@/pages/contacts/ContactDetailPage'));
const CompanyListPage = React.lazy(() => import('@/pages/contacts/CompanyListPage'));
const CompanyDetailPage = React.lazy(() => import('@/pages/contacts/CompanyDetailPage'));
const PipelinePage = React.lazy(() => import('@/pages/crm/PipelinePage'));
const DealListPage = React.lazy(() => import('@/pages/crm/DealListPage'));
const DealDetailPage = React.lazy(() => import('@/pages/crm/DealDetailPage'));
const TicketListPage = React.lazy(() => import('@/pages/helpdesk/TicketListPage'));
const TicketDetailPage = React.lazy(() => import('@/pages/helpdesk/TicketDetailPage'));
const TicketKanbanPage = React.lazy(() => import('@/pages/helpdesk/TicketKanbanPage'));

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="contacts" element={<ContactListPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="companies" element={<CompanyListPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
          <Route path="crm/pipeline" element={<PipelinePage />} />
          <Route path="crm/deals" element={<DealListPage />} />
          <Route path="crm/deals/:id" element={<DealDetailPage />} />
          <Route path="helpdesk/tickets" element={<TicketListPage />} />
          <Route path="helpdesk/tickets/:id" element={<TicketDetailPage />} />
          <Route path="helpdesk/kanban" element={<TicketKanbanPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

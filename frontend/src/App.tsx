import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompanyListPage from './pages/CompanyListPage';
import AddCompanyPage from './pages/AddCompanyPage';
import ContactListPage from './pages/ContactListPage';
import AddContactPage from './pages/AddContactPage';
import SegmentsOverviewPage from './pages/SegmentsOverviewPage';
import CreateSegmentPage from './pages/CreateSegmentPage';
import ApprovalQueuePage from './pages/ApprovalQueuePage';
import ResearcherWorkbenchPage from './pages/ResearcherWorkbenchPage';
import CsvUploadPage from './pages/CsvUploadPage';
import CsvMappingPage from './pages/CsvMappingPage';
import UserManagementPage from './pages/UserManagementPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/companies" element={<CompanyListPage />} />
              <Route path="/companies/add" element={<AddCompanyPage />} />
              <Route path="/contacts" element={<ContactListPage />} />
              <Route path="/contacts/add" element={<AddContactPage />} />
              <Route path="/segments" element={<SegmentsOverviewPage />} />
              <Route path="/segments/create" element={<CreateSegmentPage />} />
              <Route path="/approval-queue" element={<ApprovalQueuePage />} />
              <Route path="/workbench" element={<ResearcherWorkbenchPage />} />
              <Route path="/upload" element={<CsvUploadPage />} />
              <Route path="/upload/mapping" element={<CsvMappingPage />} />
              <Route path="/users" element={<UserManagementPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

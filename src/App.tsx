import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/companies"
          element={
            <Layout>
              <CompanyListPage />
            </Layout>
          }
        />
        <Route
          path="/companies/add"
          element={
            <Layout>
              <AddCompanyPage />
            </Layout>
          }
        />
        <Route
          path="/contacts"
          element={
            <Layout>
              <ContactListPage />
            </Layout>
          }
        />
        <Route
          path="/contacts/add"
          element={
            <Layout>
              <AddContactPage />
            </Layout>
          }
        />
        <Route
          path="/segments"
          element={
            <Layout>
              <SegmentsOverviewPage />
            </Layout>
          }
        />
        <Route
          path="/segments/create"
          element={
            <Layout>
              <CreateSegmentPage />
            </Layout>
          }
        />
        <Route
          path="/approval-queue"
          element={
            <Layout>
              <ApprovalQueuePage />
            </Layout>
          }
        />
        <Route
          path="/workbench"
          element={
            <Layout>
              <ResearcherWorkbenchPage />
            </Layout>
          }
        />
        <Route
          path="/upload"
          element={
            <Layout>
              <CsvUploadPage />
            </Layout>
          }
        />
        <Route
          path="/upload/mapping"
          element={
            <Layout>
              <CsvMappingPage />
            </Layout>
          }
        />
        <Route
          path="/user-management"
          element={
            <Layout>
              <UserManagementPage />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

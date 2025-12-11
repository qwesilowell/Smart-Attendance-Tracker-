import { useAuth } from '../context/AuthContext';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './user/UserDashboard';

const Dashboard = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default Dashboard;
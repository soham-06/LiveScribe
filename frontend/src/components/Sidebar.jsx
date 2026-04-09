import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineViewGrid, HiOutlineUpload, HiOutlineLogout } from 'react-icons/hi';
import { RiVoiceprintLine } from 'react-icons/ri';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initial = user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <RiVoiceprintLine />
        </div>
        <h2>Livescribe</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <HiOutlineViewGrid />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <HiOutlineUpload />
          <span>Upload Meeting</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button
          className="sidebar-link"
          onClick={handleSignOut}
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <HiOutlineLogout />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

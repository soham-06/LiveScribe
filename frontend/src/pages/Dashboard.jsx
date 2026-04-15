import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetings, deleteMeeting } from '../lib/api';
import Sidebar from '../components/Sidebar';
import MeetingCard from '../components/MeetingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import GoogleCalendar from '../components/GoogleCalendar';
import { HiOutlineUpload, HiOutlineSearch, HiOutlineMicrophone } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFilteredMeetings(
        meetings.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            (m.summary && m.summary.toLowerCase().includes(q))
        )
      );
    } else {
      setFilteredMeetings(meetings);
    }
  }, [search, meetings]);

  const fetchMeetings = async () => {
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteMeeting(deleteId);
      setMeetings((prev) => prev.filter((m) => m.id !== deleteId));
      toast.success('Meeting deleted');
    } catch (err) {
      toast.error('Failed to delete meeting');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>My Meetings</h1>
            <p className="page-header-subtitle">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-bar">
              <HiOutlineSearch />
              <input
                type="text"
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-meetings"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/upload')}
              id="upload-btn"
            >
              <HiOutlineUpload />
              Upload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="meetings-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineMicrophone />
            </div>
            <h3>{search ? 'No meetings found' : 'No meetings yet'}</h3>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Upload your first meeting recording to get AI-powered insights.'}
            </p>
            {!search && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
              >
                <HiOutlineUpload />
                Upload Your First Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="meetings-grid">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Google Calendar */}
        <GoogleCalendar />

        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Meeting?</h3>
              <p>This will permanently delete this meeting and its audio file. This action cannot be undone.</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

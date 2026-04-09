import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeeting, deleteMeeting } from '../lib/api';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineClipboardCopy,
  HiOutlineTrash,
  HiOutlineCheck,
} from 'react-icons/hi';
import {
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const data = await getMeeting(id);
      setMeeting(data);
    } catch (err) {
      toast.error('Failed to load meeting');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (meeting?.transcript) {
      await navigator.clipboard.writeText(meeting.transcript);
      setCopied(true);
      toast.success('Transcript copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting(id);
      toast.success('Meeting deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete meeting');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <LoadingSpinner text="Loading meeting details..." />
        </main>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Back Link */}
        <a className="detail-back" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <HiOutlineArrowLeft />
          Back to Dashboard
        </a>

        {/* Header */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h1>{meeting.title}</h1>
            <button
              className="btn btn-danger"
              onClick={() => setShowDelete(true)}
              style={{ flexShrink: 0 }}
              id="delete-meeting-btn"
            >
              <HiOutlineTrash />
              Delete
            </button>
          </div>
          <div className="detail-meta">
            <span className="detail-meta-item">
              <HiOutlineCalendar />
              {formatDate(meeting.created_at)}
            </span>
            <span className="detail-meta-item">
              {formatTime(meeting.created_at)}
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="detail-sections">
          {/* Summary */}
          {meeting.summary && (
            <section className="detail-section" id="section-summary">
              <div className="detail-section-header">
                <div className="detail-section-title">
                  <HiOutlineSparkles />
                  Summary
                </div>
              </div>
              <div className="detail-section-body">
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {meeting.summary}
                </p>
              </div>
            </section>
          )}

          {/* Key Points */}
          {meeting.key_points && meeting.key_points.length > 0 && (
            <section className="detail-section" id="section-key-points">
              <div className="detail-section-header">
                <div className="detail-section-title">
                  <HiOutlineLightBulb />
                  Key Points
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {meeting.key_points.length} points
                </span>
              </div>
              <div className="detail-section-body">
                <ul className="key-points-list">
                  {meeting.key_points.map((point, i) => (
                    <li key={i} className="key-point-item">
                      <div className="key-point-bullet" />
                      <span className="key-point-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Action Items */}
          {meeting.action_items && meeting.action_items.length > 0 && (
            <section className="detail-section" id="section-action-items">
              <div className="detail-section-header">
                <div className="detail-section-title">
                  <HiOutlineClipboardDocumentList />
                  Action Items
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {meeting.action_items.length} items
                </span>
              </div>
              <div className="detail-section-body" style={{ padding: 0 }}>
                <table className="action-items-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Task</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.action_items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <span className="action-person-badge">
                            {item.person || 'Unassigned'}
                          </span>
                        </td>
                        <td>{item.task}</td>
                        <td>
                          <span className="action-deadline-badge">
                            {item.deadline || 'Not specified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Transcript */}
          {meeting.transcript && (
            <section className="detail-section" id="section-transcript">
              <div className="detail-section-header">
                <div className="detail-section-title">
                  <HiOutlineDocumentText />
                  Full Transcript
                </div>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyTranscript}
                >
                  {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="detail-section-body">
                <div className="transcript-text">{meeting.transcript}</div>
              </div>
            </section>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDelete && (
          <div className="confirm-overlay" onClick={() => setShowDelete(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Meeting?</h3>
              <p>
                This will permanently delete "{meeting.title}" and its audio file.
                This action cannot be undone.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
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

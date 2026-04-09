import { useNavigate } from 'react-router-dom';
import { HiOutlineTrash, HiOutlineCalendar } from 'react-icons/hi';

export default function MeetingCard({ meeting, onDelete }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClick = () => {
    navigate(`/meetings/${meeting.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(meeting.id);
  };

  return (
    <div className="meeting-card" onClick={handleClick} id={`meeting-card-${meeting.id}`}>
      <div className="meeting-card-header">
        <h3 className="meeting-card-title">{meeting.title}</h3>
        <span className="meeting-card-date">
          <HiOutlineCalendar style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          {formatDate(meeting.created_at)}
        </span>
      </div>

      {meeting.summary && (
        <p className="meeting-card-summary">{meeting.summary}</p>
      )}

      <div className="meeting-card-actions">
        <button
          className="btn btn-ghost btn-danger"
          onClick={handleDelete}
          title="Delete meeting"
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
        >
          <HiOutlineTrash />
        </button>
      </div>
    </div>
  );
}

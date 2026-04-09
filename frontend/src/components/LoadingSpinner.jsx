export default function LoadingSpinner({ size = 'md', text = '' }) {
  return (
    <div className="spinner-container">
      <div style={{ textAlign: 'center' }}>
        <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
        {text && (
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMeeting } from '../lib/api';
import Sidebar from '../components/Sidebar';
import { HiOutlineUpload } from 'react-icons/hi';
import { RiVoiceprintLine } from 'react-icons/ri';
import { HiOutlineCpuChip, HiOutlineSparkles, HiOutlineCloudArrowUp, HiOutlineMusicalNote, HiOutlineCheck } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'upload', label: 'Uploading audio...', icon: <HiOutlineCloudArrowUp /> },
  { id: 'transcribe', label: 'Transcribing with Whisper...', icon: <RiVoiceprintLine /> },
  { id: 'analyze', label: 'Analyzing with AI...', icon: <HiOutlineSparkles /> },
  { id: 'save', label: 'Saving results...', icon: <HiOutlineCpuChip /> },
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      const allowed = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'mp4', 'wma'];
      if (!allowed.includes(ext)) {
        toast.error(`Unsupported file type. Allowed: ${allowed.join(', ')}`);
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }
      setFile(selectedFile);
      if (!title) {
        // Auto-generate title from filename
        const name = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select an audio file');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    setProcessing(true);
    setCurrentStep(0);

    // Simulate step progression (the backend does it all in one call)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 4000);

    try {
      const result = await uploadMeeting(file, title.trim());
      clearInterval(stepInterval);
      setCurrentStep(STEPS.length); // all done
      toast.success('Meeting processed successfully!');
      setTimeout(() => {
        navigate(`/meetings/${result.id}`);
      }, 1000);
    } catch (err) {
      clearInterval(stepInterval);
      setProcessing(false);
      setCurrentStep(-1);
      toast.error(err.message || 'Upload failed');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Upload Meeting</h1>
            <p className="page-header-subtitle">
              Upload an audio recording to get AI-powered insights
            </p>
          </div>
        </div>

        <div className="upload-container">
          {!processing ? (
            <>
              {/* Drop Zone */}
              <div
                className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="upload-dropzone-icon">
                  <HiOutlineUpload />
                </div>
                <h3>Drag & drop your audio file here</h3>
                <p>or click to browse · MP3, WAV, M4A, OGG, FLAC · Max 50MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  id="file-input"
                />
              </div>

              {/* Selected File Info */}
              {file && (
                <div className="upload-file-info">
                  <div className="upload-file-icon">
                    <HiOutlineMusicalNote />
                  </div>
                  <div>
                    <div className="upload-file-name">{file.name}</div>
                    <div className="upload-file-size">{formatSize(file.size)}</div>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label htmlFor="meeting-title">Meeting Title</label>
                <input
                  id="meeting-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Weekly Standup — April 9"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={!file || !title.trim()}
                style={{ marginTop: '0.5rem' }}
                id="upload-submit"
              >
                <HiOutlineSparkles />
                Process Meeting
              </button>
            </>
          ) : (
            <>
              {/* Processing Steps */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Processing your meeting...</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  This may take a minute depending on recording length
                </p>
              </div>

              <div className="processing-steps">
                {STEPS.map((step, i) => {
                  let status = '';
                  if (i < currentStep) status = 'completed';
                  else if (i === currentStep) status = 'active';

                  return (
                    <div key={step.id} className={`processing-step ${status}`}>
                      <div className="processing-step-icon">
                        {status === 'completed' ? <HiOutlineCheck /> : step.icon}
                      </div>
                      <span className="processing-step-text">
                        {status === 'completed'
                          ? step.label.replace('...', ' ✓')
                          : step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {currentStep >= STEPS.length && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.05rem' }}>
                    ✨ All done! Redirecting to your meeting...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

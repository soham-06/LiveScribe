import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Authenticated fetch wrapper — attaches Supabase JWT to all requests.
 */
async function apiFetch(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a meeting audio file with title.
 */
export async function uploadMeeting(file, title) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  return apiFetch('/meetings/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get all meetings for the authenticated user.
 */
export async function getMeetings() {
  return apiFetch('/meetings/');
}

/**
 * Get full details of a specific meeting.
 */
export async function getMeeting(id) {
  return apiFetch(`/meetings/${id}`);
}

/**
 * Delete a meeting.
 */
export async function deleteMeeting(id) {
  return apiFetch(`/meetings/${id}`, { method: 'DELETE' });
}

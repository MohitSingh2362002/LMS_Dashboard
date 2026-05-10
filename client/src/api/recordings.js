import api from './client.js';

/** List recordings. Params: { courseId?, liveClassId?, status? } */
export const getRecordings = (params = {}) =>
  api.get('/recordings', { params }).then((r) => r.data);

/** Single recording (includes embedUrl) */
export const getRecordingById = (id) =>
  api.get(`/recordings/${id}`).then((r) => r.data);

/** Delete a recording (admin/instructor) */
export const deleteRecording = (id) =>
  api.delete(`/recordings/${id}`).then((r) => r.data);

import api from './client.js';

/** List videos for a course (admin/instructor: all; learner: only ready) */
export const getCourseVideos = (courseId) =>
  api.get(`/courses/${courseId}/videos`).then((r) => r.data);

/** Init a new video upload — returns TUS credentials */
export const initCourseVideo = (courseId, payload) =>
  api.post(`/courses/${courseId}/videos/init`, payload).then((r) => r.data);

/** Mark a video upload complete */
export const completeCourseVideo = (courseId, videoId, payload = {}) =>
  api.post(`/courses/${courseId}/videos/${videoId}/complete`, payload).then((r) => r.data);

/** Update video metadata (title / description / order) */
export const updateCourseVideo = (courseId, videoId, payload) =>
  api.put(`/courses/${courseId}/videos/${videoId}`, payload).then((r) => r.data);

/** Delete a video */
export const deleteCourseVideo = (courseId, videoId) =>
  api.delete(`/courses/${courseId}/videos/${videoId}`).then((r) => r.data);

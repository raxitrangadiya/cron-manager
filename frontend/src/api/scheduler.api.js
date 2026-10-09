import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/scheduler',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data.data;
};

export const getJobTypes = async () => {
  const response = await api.get('/job-types');
  return response.data.data;
};

export const getJobs = async () => {
  const response = await api.get('/jobs');
  return response.data.data;
};

export const getJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data.data;
};

export const createJob = async (jobData) => {
  const response = await api.post('/jobs', jobData);
  return response.data.data;
};

export const updateJob = async ({ id, jobData }) => {
  const response = await api.put(`/jobs/${id}`, jobData);
  return response.data.data;
};

export const pauseJob = async (id) => {
  const response = await api.patch(`/jobs/${id}/pause`);
  return response.data.data;
};

export const resumeJob = async (id) => {
  const response = await api.patch(`/jobs/${id}/resume`);
  return response.data.data;
};

export const triggerJobNow = async (id) => {
  const response = await api.post(`/jobs/${id}/trigger`);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};

export const getJobLogs = async (id) => {
  const response = await api.get(`/jobs/${id}/logs`);
  return response.data.data;
};

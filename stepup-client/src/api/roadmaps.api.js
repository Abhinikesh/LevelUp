import api from './axios';

export const fetchRoadmaps = () => 
  api.get('/roadmaps');

export const fetchRoadmap = (id) => 
  api.get(`/roadmaps/${id}`);

export const createRoadmap = (data) => 
  api.post('/roadmaps', data);

export const deleteRoadmap = (id) => 
  api.delete(`/roadmaps/${id}`);

export const fetchLevels = (roadmapId) => 
  api.get(`/levels/roadmap/${roadmapId}`);

export const completeLevel = (levelId, data) => 
  api.post(`/levels/${levelId}/complete`, data);

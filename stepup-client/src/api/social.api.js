import api from './axios';

export const fetchFriends = () => 
  api.get('/social/friends');

export const sendFriendRequest = (email) => 
  api.post('/social/friends/add', { email });

export const acceptFriendRequest = (friendId) => 
  api.put(`/social/friends/accept/${friendId}`);

export const fetchPendingRequests = () => 
  api.get('/social/friends/pending');

export const fetchHistory = () => 
  api.get('/users/history');

export const fetchTrophies = () => 
  api.get('/users/trophies');

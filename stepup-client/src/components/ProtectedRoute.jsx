import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useStore(
    state => state.isAuthenticated
  );
  const token = localStorage.getItem('stepup_token');
  
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

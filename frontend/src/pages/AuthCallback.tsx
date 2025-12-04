import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: setAuthToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (token) {
      // Set token in localStorage and axios headers
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirect to home
      navigate('/');
      window.location.reload();
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress size={64} sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Đang đăng nhập...
      </Typography>
    </Box>
  );
};

export default AuthCallback;


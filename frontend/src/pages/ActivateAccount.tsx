import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Email } from '@mui/icons-material';
import axios from 'axios';

const ActivateAccount = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/auth/activate/${token}`);
        
        if (response.data.success) {
          setSuccess(true);
          // Auto login user
          localStorage.setItem('token', response.data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/');
            window.location.reload();
          }, 2000);
        }
      } catch (error: any) {
        setError(
          error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn'
        );
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [token, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3} className="animate-fade-in-up">
        <CardContent sx={{ p: { xs: 4, md: 5 }, textAlign: 'center' }}>
          {loading ? (
            <Box>
              <CircularProgress size={64} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Đang kích hoạt tài khoản...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vui lòng đợi trong giây lát
              </Typography>
            </Box>
          ) : success ? (
            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  mb: 3,
                }}
                className="animate-scale-in"
              >
                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Kích hoạt thành công!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Tài khoản của bạn đã được kích hoạt. Bạn sẽ được chuyển đến trang chủ...
              </Typography>
              <Button
                component={Link}
                to="/"
                variant="contained"
                sx={{
                  mt: 2,
                  background: 'linear-gradient(45deg, #2563eb 30%, #6366f1 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)',
                  },
                }}
              >
                Đi đến trang chủ
              </Button>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  mb: 3,
                }}
                className="animate-scale-in"
              >
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Kích hoạt thất bại
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error || 'Token không hợp lệ hoặc đã hết hạn'}
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Email />}
                  onClick={async () => {
                    try {
                      const email = prompt('Vui lòng nhập email của bạn:');
                      if (email) {
                        await axios.post('/api/auth/resend-activation', { email });
                        alert('Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
                      }
                    } catch (error: any) {
                      alert(
                        error.response?.data?.message ||
                          'Không thể gửi email. Vui lòng thử lại sau.'
                      );
                    }
                  }}
                  sx={{
                    background: 'linear-gradient(45deg, #2563eb 30%, #6366f1 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)',
                    },
                  }}
                >
                  Gửi lại email kích hoạt
                </Button>
                <Button component={Link} to="/login" variant="outlined">
                  Quay lại đăng nhập
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ActivateAccount;


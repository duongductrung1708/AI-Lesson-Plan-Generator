import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Link as MuiLink,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import { Lock as LockIcon, Google, Email } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/axios.config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('chưa được kích hoạt') || message.includes('kích hoạt')) {
          setErrors({ 
            general: message,
            showResend: 'true',
          });
        } else if (message.includes('Email') || message.includes('mật khẩu')) {
          setErrors({ general: 'Email hoặc mật khẩu không đúng' });
        } else {
          setErrors({ general: message });
        }
      } else {
        setErrors({ general: 'Đăng nhập thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email trước');
      return;
    }

    setResendingEmail(true);
    try {
      await axios.post('/api/auth/resend-activation', { email });
      toast.success('Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
      setErrors({});
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Không thể gửi email. Vui lòng thử lại sau.'
      );
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3} className="animate-fade-in-up">
        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2563eb 30%, #6366f1 90%)',
                mb: 2,
                boxShadow: 3,
              }}
              className="animate-scale-in"
            >
              <LockIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Đăng nhập
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Chào mừng bạn trở lại!
            </Typography>
          </Box>

          {errors.general && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                errors.showResend && (
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<Email />}
                    onClick={handleResendActivation}
                    disabled={resendingEmail}
                  >
                    {resendingEmail ? 'Đang gửi...' : 'Gửi lại email'}
                  </Button>
                )
              }
            >
              {errors.general}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="your.email@example.com"
                variant="outlined"
                disabled={loading}
                error={!!errors.email}
                helperText={errors.email}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <PasswordInput
                  label="Mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  required
                  placeholder="Nhập mật khẩu của bạn"
                  disabled={loading}
                  error={!!errors.password}
                  helperText={errors.password}
                />
                <Box textAlign="right">
                  <MuiLink
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Quên mật khẩu?
                  </MuiLink>
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2563eb 30%, #6366f1 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              HOẶC
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<Google />}
            onClick={() => {
              window.location.href = getApiUrl('/api/auth/google');
            }}
            sx={{
              py: 1.5,
              borderColor: '#db4437',
              color: '#db4437',
              '&:hover': {
                borderColor: '#c23321',
                backgroundColor: 'rgba(219, 68, 55, 0.04)',
              },
            }}
          >
            Đăng nhập với Google
          </Button>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Chưa có tài khoản?{' '}
              <MuiLink
                component={Link}
                to="/register"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Đăng ký ngay
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;

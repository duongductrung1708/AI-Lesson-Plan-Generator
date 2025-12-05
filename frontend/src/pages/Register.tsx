import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "@mui/material";
import { PersonAdd as PersonAddIcon, Google } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import PasswordInput from "../components/PasswordInput";
import { getApiUrl } from "../config/axios.config";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { register } = useAuth();

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất một chữ cái viết hoa";
    }
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải có ít nhất một chữ cái thường";
    }
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất một số";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*...)";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên của bạn";
    }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      // Show success message about activation email
      setErrors({
        general: "success",
      });
      // Don't navigate immediately - show message about checking email
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const serverErrors: { [key: string]: string } = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.param === "email") {
            serverErrors.email = "Email đã được sử dụng";
          } else if (err.param === "password") {
            serverErrors.password = err.msg;
          }
        });
        setErrors(serverErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3} className="animate-fade-in-up">
        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 2,
                background: "linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)",
                mb: 2,
                boxShadow: 3,
              }}
              className="animate-scale-in"
            >
              <PersonAddIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Tạo tài khoản
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bắt đầu hành trình tạo giáo án thông minh
            </Typography>
          </Box>

          {errors.general && errors.general === "success" && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản
              của bạn.
            </Alert>
          )}
          {errors.general && errors.general !== "success" && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Tên của bạn"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Nhập tên của bạn"
                variant="outlined"
                disabled={loading}
                error={!!errors.name}
                helperText={errors.name}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="your.email@example.com"
                variant="outlined"
                disabled={loading}
                error={!!errors.email}
                helperText={errors.email}
              />

              <PasswordInput
                label="Mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                required
                placeholder="Nhập mật khẩu mạnh"
                disabled={loading}
                showStrength={true}
                error={!!errors.password}
                helperText={errors.password}
              />

              <PasswordInput
                label="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                required
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
                confirmPassword={password}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  background:
                    "linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)",
                  },
                  mt: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Đăng ký"
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
              window.location.href = getApiUrl("/api/auth/google");
            }}
            sx={{
              py: 1.5,
              borderColor: "#db4437",
              color: "#db4437",
              "&:hover": {
                borderColor: "#c23321",
                backgroundColor: "rgba(219, 68, 55, 0.04)",
              },
            }}
          >
            Đăng ký với Google
          </Button>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Đã có tài khoản?{" "}
              <MuiLink
                component={Link}
                to="/login"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Đăng nhập
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register;

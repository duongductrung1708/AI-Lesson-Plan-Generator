import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { Lock as LockIcon, Email, VpnKey } from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import PasswordInput from "../components/PasswordInput";

const steps = ["Nhập email", "Nhập mã OTP", "Đặt lại mật khẩu"];

const ForgotPassword = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  const handleSendOTP = async () => {
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Vui lòng nhập email" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Email không hợp lệ" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      toast.success(
        response.data.message || "Mã OTP đã được gửi đến email của bạn"
      );
      setActiveStep(1);
      if (response.data.timeRemaining) {
        setTimeRemaining(response.data.timeRemaining);
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        const remaining = error.response.data.timeRemaining;
        setTimeRemaining(remaining);
        toast.error(
          error.response.data.message || "Vui lòng đợi trước khi gửi lại"
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Không thể gửi mã OTP. Vui lòng thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setErrors({});
    if (!otp.trim()) {
      setErrors({ otp: "Vui lòng nhập mã OTP" });
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrors({ otp: "Mã OTP phải là 6 chữ số" });
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      setActiveStep(2);
      toast.success("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn";
      setErrors({ otp: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrors({});
    const newErrors: { [key: string]: string } = {};

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất một chữ cái viết hoa";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất một chữ cái thường";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất một số";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất một ký tự đặc biệt";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast.success(
        "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới."
      );
      navigate("/login");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      );
      if (error.response?.data?.message?.includes("OTP")) {
        setActiveStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeRemaining && timeRemaining > 0) {
      toast.error(`Vui lòng đợi ${timeRemaining} giây trước khi gửi lại`);
      return;
    }
    await handleSendOTP();
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
                background: "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                mb: 2,
                boxShadow: 3,
              }}
              className="animate-scale-in"
            >
              <LockIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Quên mật khẩu
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Nhập email để nhận mã OTP đặt lại mật khẩu
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                InputProps={{
                  startAdornment: (
                    <Email sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />

              <Button
                onClick={handleSendOTP}
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  background:
                    "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Gửi mã OTP"
                )}
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Mã OTP đã được gửi đến email <strong>{email}</strong>. Vui lòng
                kiểm tra hộp thư.
              </Alert>

              <TextField
                fullWidth
                label="Mã OTP"
                type="text"
                required
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                  if (errors.otp) setErrors({ ...errors, otp: "" });
                }}
                placeholder="Nhập 6 chữ số"
                variant="outlined"
                disabled={loading}
                error={!!errors.otp}
                helperText={
                  errors.otp || "Nhập mã OTP 6 chữ số đã nhận được qua email"
                }
                InputProps={{
                  startAdornment: (
                    <VpnKey sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    fontSize: "1.5rem",
                    letterSpacing: "0.5rem",
                  },
                }}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  onClick={() => setActiveStep(0)}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  variant="contained"
                  fullWidth
                  disabled={loading || otp.length !== 6}
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    background:
                      "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Xác nhận"
                  )}
                </Button>
              </Box>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Chưa nhận được mã?{" "}
                  {timeRemaining && timeRemaining > 0 ? (
                    <Typography component="span" variant="body2" color="error">
                      Gửi lại sau {timeRemaining}s
                    </Typography>
                  ) : (
                    <MuiLink
                      component="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      sx={{
                        fontWeight: 600,
                        color: "primary.main",
                        textDecoration: "none",
                        cursor: "pointer",
                        border: "none",
                        background: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Gửi lại mã OTP
                    </MuiLink>
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <PasswordInput
                label="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword)
                    setErrors({ ...errors, newPassword: "" });
                }}
                required
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
                error={!!errors.newPassword}
                helperText={
                  errors.newPassword ||
                  "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                }
                showStrength={true}
              />

              <PasswordInput
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                required
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                confirmPassword={newPassword}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  onClick={() => setActiveStep(1)}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handleResetPassword}
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    background:
                      "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          <Box textAlign="center" sx={{ mt: 3 }}>
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
              ← Quay lại đăng nhập
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ForgotPassword;

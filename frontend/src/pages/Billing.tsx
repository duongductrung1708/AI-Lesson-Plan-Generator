import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";

interface Subscription {
  _id: string | null;
  duration?: 1 | 6 | 12 | null;
  plan?: string; // For backward compatibility with old subscriptions
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  paymentStatus: "pending" | "paid" | "failed";
  isActive: boolean;
}

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get("/api/billing");
      // Always set subscription (even if null, backend returns free plan object)
      setSubscription(
        response.data.data || {
          _id: null,
          duration: null,
          plan: "free",
          status: "expired",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          paymentStatus: "pending",
          isActive: false,
        }
      );
    } catch (error: any) {
      toast.error("Lỗi khi tải thông tin subscription");
      console.error("Error fetching subscription:", error);
      // Set free plan on error
      setSubscription({
        _id: null,
        duration: null,
        plan: "free",
        status: "expired",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        paymentStatus: "pending",
        isActive: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (duration: 1 | 6 | 12) => {
    setProcessing(true);
    try {
      const response = await axios.post("/api/billing/momo", {
        duration,
      });

      if (response.data?.payUrl) {
        toast.success("Đang chuyển đến trang thanh toán MoMo...");
        window.location.href = response.data.payUrl;
      } else {
        toast.error("Không lấy được link thanh toán MoMo.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi khi tạo thanh toán MoMo"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy subscription?")) {
      return;
    }

    setProcessing(true);
    try {
      await axios.put("/api/billing/cancel");
      toast.success("Hủy subscription thành công");
      await fetchSubscription();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy subscription");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDurationPrice = (duration: number) => {
    const monthlyPrice = 50000; // 199k VNĐ/tháng
    const totalPrice = monthlyPrice * duration;
    const discount = duration === 6 ? 0.1 : duration === 12 ? 0.2 : 0; // 10% off for 6 months, 20% off for 12 months
    const finalPrice = totalPrice * (1 - discount);

    return {
      monthly: monthlyPrice,
      total: totalPrice,
      final: Math.round(finalPrice),
      discount,
    };
  };

  const getDurationLabel = (duration?: number | null) => {
    if (!duration) return "Free";
    switch (duration) {
      case 1:
        return "1 tháng";
      case 6:
        return "6 tháng";
      case 12:
        return "1 năm";
      default:
        return `${duration} tháng`;
    }
  };

  const plans = [
    { duration: 1 as const, label: "1 tháng" },
    { duration: 6 as const, label: "6 tháng" },
    { duration: 12 as const, label: "1 năm" },
  ];

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Billing & Subscription
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Đăng ký gói để sử dụng dịch vụ AI soạn giáo án tự động
      </Typography>

      {/* Current Subscription */}
      {subscription && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Gói hiện tại
            </Typography>
            <Chip
              sx={{ color: "white" }}
              label={
                subscription.isActive
                  ? "Đang hoạt động"
                  : subscription._id
                  ? "Đã hết hạn"
                  : "Gói Free"
              }
              color={
                subscription.isActive
                  ? "success"
                  : subscription._id
                  ? "error"
                  : "default"
              }
              icon={
                subscription.isActive ? <CheckCircleIcon /> : <CancelIcon />
              }
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Gói đăng ký
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {subscription.duration
                  ? getDurationLabel(subscription.duration)
                  : subscription.plan && subscription.plan !== "free"
                  ? subscription.plan.charAt(0).toUpperCase() +
                    subscription.plan.slice(1)
                  : "Free"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Trạng thái thanh toán
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {subscription._id
                  ? subscription.paymentStatus === "paid"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"
                  : "Miễn phí"}
              </Typography>
            </Grid>
            {subscription._id && (
              <>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày bắt đầu
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(subscription.startDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày hết hạn
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(subscription.endDate)}
                  </Typography>
                </Grid>
              </>
            )}
            {!subscription._id && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Bạn đang sử dụng gói Free. Đăng ký gói để sử dụng không giới
                  hạn dịch vụ AI soạn giáo án.
                </Alert>
              </Grid>
            )}
            {subscription.isActive && subscription._id && (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancel}
                  disabled={processing}
                  sx={{ mt: 2 }}
                >
                  Hủy subscription
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Subscription Plans */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Chọn gói đăng ký
      </Typography>
      <Grid container spacing={3}>
        {plans.map((plan) => {
          const price = getDurationPrice(plan.duration);
          const isCurrentPlan =
            subscription?.duration === plan.duration && subscription?.isActive;

          return (
            <Grid item xs={12} md={4} key={plan.duration}>
              <Card
                sx={{
                  height: "100%",
                  border: isCurrentPlan ? "2px solid" : "1px solid",
                  borderColor: isCurrentPlan ? "primary.main" : "divider",
                  position: "relative",
                  background: isCurrentPlan
                    ? "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)"
                    : "transparent",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {plan.duration === 12 && (
                    <Chip
                      label="Tiết kiệm nhất"
                      color="primary"
                      size="small"
                      sx={{ position: "absolute", top: 16, right: 16 }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {plan.label}
                    </Typography>
                    {isCurrentPlan && (
                      <Chip label="Gói hiện tại" color="primary" size="small" />
                    )}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    {price.discount > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through", mb: 0.5 }}
                      >
                        {price.total.toLocaleString("vi-VN")} VNĐ
                      </Typography>
                    )}
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {price.final.toLocaleString("vi-VN")} VNĐ
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {price.discount > 0 && (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          Tiết kiệm {Math.round(price.discount * 100)}%{" "}
                        </span>
                      )}
                      ({price.monthly.toLocaleString("vi-VN")} VNĐ/tháng)
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircleIcon
                        sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                      />
                      <Typography variant="body2">
                        Tạo giáo án với AI không giới hạn
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircleIcon
                        sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                      />
                      <Typography variant="body2">
                        Sử dụng AI soạn giáo án tự động
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircleIcon
                        sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                      />
                      <Typography variant="body2">
                        Upload file lên đến 50MB
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CheckCircleIcon
                        sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                      />
                      <Typography variant="body2">Hỗ trợ email</Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={isCurrentPlan ? "outlined" : "contained"}
                    fullWidth
                    onClick={() => handleSubscribe(plan.duration)}
                    disabled={processing || isCurrentPlan}
                    startIcon={<CreditCardIcon />}
                    sx={{
                      background: isCurrentPlan
                        ? undefined
                        : "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                    }}
                  >
                    {isCurrentPlan ? "Đang sử dụng" : "Đăng ký ngay"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {!subscription?.isActive && subscription && (
        <Alert severity="warning" sx={{ mt: 4 }}>
          Gói của bạn đã hết hạn. Vui lòng đăng ký gói mới để tiếp tục sử dụng
          dịch vụ AI soạn giáo án.
        </Alert>
      )}

      {!subscription && (
        <Alert severity="info" sx={{ mt: 4 }}>
          Bạn chưa có gói đăng ký. Vui lòng chọn một trong các gói trên để bắt
          đầu sử dụng dịch vụ AI soạn giáo án.
        </Alert>
      )}
    </Container>
  );
};

export default Billing;

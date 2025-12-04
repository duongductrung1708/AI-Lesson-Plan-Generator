import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Gavel,
  Shield,
  Payment,
  Restore,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const policies = [
  {
    title: "Điều khoản sử dụng",
    icon: <Gavel color="primary" />,
    bullets: [
      "Chỉ sử dụng nội dung được tạo cho mục đích giáo dục hợp pháp.",
      "Không chia sẻ trái phép tài khoản hoặc sản phẩm có bản quyền.",
      "Không can thiệp, sao chép hoặc bán lại dịch vụ khi chưa có sự đồng ý bằng văn bản.",
    ],
  },
  {
    title: "Chính sách bảo mật",
    icon: <Shield color="success" />,
    bullets: [
      "Mật khẩu người dùng được mã hóa và không thể truy ngược.",
      "Thông tin hỗ trợ (email, OTP) chỉ dùng cho mục đích xác thực.",
      "Người dùng có quyền yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào.",
    ],
  },
  {
    title: "Thanh toán & gói dịch vụ",
    icon: <Payment color="secondary" />,
    bullets: [
      "Các gói 1-6-12 tháng được gia hạn thủ công, không auto-renew.",
      "Không hoàn tiền giữa kỳ trừ khi dịch vụ ngưng hoạt động quá 72 giờ.",
      "Biên lai thanh toán sẽ được gửi qua email trong vòng 24 giờ.",
    ],
  },
  {
    title: "Lưu trữ và xóa dữ liệu",
    icon: <Restore color="warning" />,
    bullets: [
      "Giáo án được lưu trên hệ thống trong 90 ngày kể từ lần chỉnh sửa cuối.",
      "Bạn có thể xóa thủ công trong mục Tài liệu; thao tác này không thể hoàn tác.",
      "Sau 90 ngày không hoạt động, dữ liệu sẽ được ẩn và xóa vĩnh viễn sau 30 ngày tiếp theo.",
    ],
  },
];

const TermsPolicies = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none" }}
        >
          Quay lại
        </Button>
      </Stack>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Terms & Policies
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Các chính sách sử dụng dịch vụ AI Lesson Plan Generator.
      </Typography>

      <Paper elevation={2} sx={{ p: 4 }}>
        {policies.map((policy) => (
          <Box key={policy.title} sx={{ mb: 4 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
            >
              {policy.icon}
              <Typography variant="h6" fontWeight="bold">
                {policy.title}
              </Typography>
            </Box>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {policy.bullets.map((bullet) => (
                <li key={bullet} style={{ marginBottom: "0.5rem" }}>
                  <Typography variant="body2" color="text.secondary">
                    {bullet}
                  </Typography>
                </li>
              ))}
            </ul>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </Paper>
      <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircle color="primary" />
        <Typography variant="body2" color="text.secondary">
          Khi tiếp tục sử dụng dịch vụ, bạn đồng ý với toàn bộ điều khoản ở
          trên.
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsPolicies;

import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const releases = [
  {
    version: "v2.3.0",
    date: "03/12/2025",
    items: [
      "Thêm chức năng đặt lại mật khẩu bằng OTP.",
      "Cải thiện trải nghiệm tải xuống giáo án.",
      "Bổ sung hệ thống Help và trang trợ giúp.",
    ],
  },
  {
    version: "v2.2.0",
    date: "15/11/2025",
    items: [
      "Hỗ trợ tải lên tệp .docx để sinh giáo án.",
      "Tối ưu hóa giao diện Billing và trạng thái gói.",
    ],
  },
];

const ReleaseNotes = () => {
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
        Release Notes
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Theo dõi các cập nhật mới nhất của AI Lesson Plan Generator.
      </Typography>

      {releases.map((release, index) => (
        <Paper key={release.version} elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight="bold">
              {release.version}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {release.date}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {release.items.map((item) => (
              <li key={item}>
                <Typography variant="body2" color="text.primary">
                  {item}
                </Typography>
              </li>
            ))}
          </ul>
        </Paper>
      ))}
    </Container>
  );
};

export default ReleaseNotes;

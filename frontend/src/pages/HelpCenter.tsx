import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import {
  HelpOutline,
  QuestionAnswer,
  School,
  TipsAndUpdates,
  CheckCircle,
  Security,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const HelpCenter = () => {
  const navigate = useNavigate();

  const helpTopics = [
    {
      title: "Bắt đầu với AI Lesson Plan",
      description: "Hướng dẫn chi tiết để tạo giáo án đầu tiên bằng AI.",
      icon: <School color="primary" />,
    },
    {
      title: "Các câu hỏi thường gặp",
      description: "Giải đáp nhanh cho những thắc mắc phổ biến.",
      icon: <QuestionAnswer color="secondary" />,
    },
    {
      title: "Liên hệ hỗ trợ",
      description: "Gửi email tới support@hanai.vn để được trợ giúp.",
      icon: <HelpOutline color="action" />,
    },
  ];

  const quickGuides = [
    {
      title: "1. Chuẩn bị thông tin",
      steps: [
        "Xác định môn học, khối lớp, thời lượng tiết học.",
        "Chuẩn bị các tài liệu mẫu hoặc yêu cầu riêng của trường.",
      ],
    },
    {
      title: "2. Sinh giáo án",
      steps: [
        "Vào trang Tạo Giáo Án, chọn template công văn phù hợp.",
        "Điền nội dung hoặc tải tệp Word mẫu để AI tham khảo.",
      ],
    },
    {
      title: "3. Kiểm tra & tải xuống",
      steps: [
        "Xem bản xem trước, chỉnh sửa nếu cần.",
        "Nhấn Tải để tải về bản .docx đã định dạng.",
      ],
    },
  ];

  const troubleshooting = [
    {
      title: "Không gửi được OTP?",
      description:
        "Đảm bảo tài khoản của bạn đã đặt mật khẩu. Nếu đăng ký Google, vui lòng đặt mật khẩu trong Profile trước khi dùng chức năng quên mật khẩu.",
      icon: <Security color="warning" />,
    },
    {
      title: "Không tạo được giáo án?",
      description:
        "Kiểm tra gói Billing hiện tại. Nếu hết hạn, hãy gia hạn hoặc dùng quota dùng thử còn lại.",
      icon: <CheckCircle color="success" />,
    },
    {
      title: "Kết quả chưa đúng yêu cầu?",
      description:
        "Thêm chi tiết cụ thể hơn (đối tượng, mục tiêu, phương pháp) hoặc đính kèm tệp mẫu để AI tham khảo.",
      icon: <TipsAndUpdates color="primary" />,
    },
  ];

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
        Trung tâm trợ giúp
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Tài liệu và hướng dẫn để giúp bạn khai thác tối đa AI Lesson Plan
        Generator.
      </Typography>
      <Paper elevation={3} sx={{ mt: 4 }}>
        <List>
          {helpTopics.map((topic) => (
            <ListItem key={topic.title} sx={{ py: 2 }}>
              <ListItemIcon>{topic.icon}</ListItemIcon>
              <ListItemText
                primary={topic.title}
                secondary={topic.description}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {quickGuides.map((guide) => (
          <Grid item xs={12} md={4} key={guide.title}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {guide.title}
              </Typography>
              <List dense>
                {guide.steps.map((step) => (
                  <ListItem key={step} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2">{step}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Xử lý sự cố nhanh
        </Typography>
        <Grid container spacing={3}>
          {troubleshooting.map((item) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Paper elevation={1} sx={{ p: 3, height: "100%" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  {item.icon}
                  <Typography variant="subtitle1" fontWeight="600">
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h6">Không tìm thấy câu trả lời?</Typography>
        <Typography variant="body2" color="text.secondary">
          Liên hệ với chúng tôi qua email support@hanai.vn để nhận được hỗ trợ
          nhanh chóng.
        </Typography>
      </Box>
    </Container>
  );
};

export default HelpCenter;

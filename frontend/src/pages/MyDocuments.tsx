import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Create as CreateIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";

interface LessonPlanSummary {
  _id: string;
  teacherName: string;
  subject: string;
  grade: string;
  educationLevel: string;
  duration: number;
  template: string;
  lessonTitle: string;
  createdAt: string;
}

const MyDocuments = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonPlans = async () => {
      try {
        const response = await axios.get("/api/lesson-plans");
        setLessonPlans(response.data.data);
      } catch (error: any) {
        toast.error("Lỗi khi tải danh sách giáo án");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonPlans();
  }, []);

  const handleDeleteClick = (id: string) => {
    setSelectedPlanId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlanId) return;

    try {
      await axios.delete(`/api/lesson-plans/${selectedPlanId}`);
      setLessonPlans(lessonPlans.filter((plan) => plan._id !== selectedPlanId));
      toast.success("Xóa giáo án thành công");
    } catch (error: any) {
      toast.error("Lỗi khi xóa giáo án");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPlanId(null);
    }
  };

  const handleDownload = async (planId: string, lessonTitle: string) => {
    try {
      const response = await axios.get(`/api/lesson-plans/${planId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao-An-${lessonTitle.replace(/\s+/g, "-")}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Tải xuống thành công");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Không tải được giáo án. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Đang tải danh sách giáo án...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
          gap: 2,
        }}
        className="animate-fade-in-down"
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Tài Liệu Của Tôi
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Quản lý và xem lại tất cả giáo án đã tạo
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/create"
          variant="contained"
          startIcon={<CreateIcon />}
          sx={{
            background: "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
            "&:hover": {
              background: "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
            },
          }}
        >
          Tạo Giáo Án Mới
        </Button>
      </Box>

      {lessonPlans.length === 0 ? (
        <Card elevation={3} className="animate-scale-in">
          <CardContent sx={{ p: { xs: 6, md: 8 }, textAlign: "center" }}>
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "linear-gradient(45deg, #dbeafe 30%, #e0e7ff 90%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
              className="animate-float"
            >
              <FolderOpenIcon sx={{ fontSize: 48, color: "primary.main" }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Chưa có giáo án nào
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Bắt đầu tạo giáo án đầu tiên của bạn ngay bây giờ!
            </Typography>
            <Button
              component={Link}
              to="/create"
              variant="contained"
              startIcon={<CreateIcon />}
              sx={{
                background: "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
                },
              }}
            >
              Tạo Giáo Án Đầu Tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {lessonPlans.map((plan, index) => (
              <Grid item xs={12} sm={6} lg={4} key={plan._id}>
                <Card
                  elevation={2}
                  className="hover-lift hover-glow animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      component={Link}
                      to={`/lesson-plan/${plan._id}`}
                      sx={{
                        fontWeight: "bold",
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "text.primary",
                        "&:hover": {
                          color: "primary.main",
                        },
                      }}
                    >
                      {plan.lessonTitle}
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                    >
                      <Chip
                        label={plan.subject}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={plan.grade}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        label={plan.educationLevel}
                        size="small"
                        sx={{ bgcolor: "purple.50", color: "purple.700" }}
                      />
                    </Box>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ⏱️ {plan.duration} phút
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📋 Công văn {plan.template}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📅{" "}
                        {new Date(plan.createdAt).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                    <Button
                      component={Link}
                      to={`/lesson-plan/${plan._id}`}
                      size="small"
                      startIcon={<VisibilityIcon />}
                      variant="outlined"
                      color="primary"
                      sx={{ flex: 1 }}
                    >
                      Xem
                    </Button>
                    <Button
                      onClick={() => handleDownload(plan._id, plan.lessonTitle)}
                      size="small"
                      startIcon={<DownloadIcon />}
                      variant="outlined"
                      color="success"
                      sx={{ flex: 1 }}
                    >
                      Tải
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(plan._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Tổng cộng:{" "}
              <Typography
                component="span"
                variant="body2"
                fontWeight="bold"
                color="text.primary"
              >
                {lessonPlans.length}
              </Typography>{" "}
              giáo án
            </Typography>
          </Box>
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa giáo án này? Hành động này không thể hoàn
            tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyDocuments;

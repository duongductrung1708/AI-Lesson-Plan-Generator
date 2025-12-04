import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Create as CreateIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateLessonPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ isActive: boolean; remainingTrial: number } | null>(null);
  const [formData, setFormData] = useState({
    teacherName: '',
    subject: '',
    grade: '',
    educationLevel: 'THCS' as 'Mầm non' | 'Tiểu học' | 'THCS' | 'THPT',
    duration: 45,
    template: '2345' as '5512' | '2345' | '1001',
    lessonTitle: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Check subscription and trial status
    const checkStatus = async () => {
      try {
        const [billingResponse, userResponse] = await Promise.all([
          axios.get('/api/billing'),
          axios.get('/api/auth/me'),
        ]);
        setSubscriptionStatus({
          isActive: billingResponse.data.data?.isActive || false,
          remainingTrial: userResponse.data.user?.remainingTrial || 0,
        });
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };
    checkStatus();
  }, []);

  const durationMap = {
    'Mầm non': 30,
    'Tiểu học': 35,
    'THCS': 45,
    'THPT': 45,
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'educationLevel') {
        newData.duration = durationMap[value as keyof typeof durationMap];
      }
      return newData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    return (
      allowedTypes.includes(file.type) || 
      allowedExtensions.includes(fileExtension)
    ) && file.size <= 10 * 1024 * 1024; // 10MB
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    droppedFiles.forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Các file sau không hợp lệ: ${invalidFiles.join(', ')}\nChỉ chấp nhận JPG, PNG, PDF, DOCX (tối đa 10MB)`
      );
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(`Đã thêm ${validFiles.length} file(s)`);
    }
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return [];

    const uploadFormData = new FormData();
    files.forEach((file) => {
      uploadFormData.append('files', file);
    });

    try {
      const response = await axios.post('/api/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.files;
    } catch (error) {
      toast.error('Lỗi khi tải lên file');
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedFiles = await handleUploadFiles();
      const response = await axios.post('/api/lesson-plans', {
        ...formData,
        uploadedFiles,
      });

      toast.success('Tạo giáo án thành công!');
      navigate(`/lesson-plan/${response.data.data._id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi tạo giáo án. Vui lòng thử lại.';
      
      // Check if error is about subscription
      if (error.response?.status === 403 && errorMessage.includes('subscription')) {
        toast.error('Bạn cần đăng ký gói để sử dụng dịch vụ AI soạn giáo án');
        setTimeout(() => {
          navigate('/billing');
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {subscriptionStatus && !subscriptionStatus.isActive && (
        <Alert 
          severity={subscriptionStatus.remainingTrial > 0 ? "info" : "warning"} 
          sx={{ mb: 3 }}
        >
          {subscriptionStatus.remainingTrial > 0 ? (
            <>
              Bạn còn {subscriptionStatus.remainingTrial} lần dùng thử miễn phí trong tháng này. 
              <Button 
                size="small" 
                onClick={() => navigate('/billing')} 
                sx={{ ml: 2 }}
              >
                Đăng ký gói
              </Button>
            </>
          ) : (
            <>
              Bạn đã sử dụng hết 3 lần dùng thử miễn phí trong tháng này. Vui lòng đăng ký gói để tiếp tục sử dụng. 
              <Button 
                size="small" 
                onClick={() => navigate('/billing')} 
                sx={{ ml: 2 }}
              >
                Đăng ký ngay
              </Button>
            </>
          )}
        </Alert>
      )}
      <Box mb={4} className="animate-fade-in-down">
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Tạo Giáo Án Mới
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Điền thông tin bên dưới để AI tạo giáo án tự động cho bạn
        </Typography>
      </Box>

      <Card elevation={3} className="animate-fade-in-up animate-delay-200">
        <CardContent sx={{ p: { xs: 3, md: 4, lg: 5 } }}>
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Đang tạo giáo án...
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên giáo viên"
                  name="teacherName"
                  required
                  value={formData.teacherName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên giáo viên"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Môn học"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="VD: Ngữ Văn, Toán, Tiếng Anh..."
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lớp"
                  name="grade"
                  required
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="VD: 6A, 7B, 10A1"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Cấp học"
                  name="educationLevel"
                  required
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  variant="outlined"
                >
                  <MenuItem value="Mầm non">Mầm non</MenuItem>
                  <MenuItem value="Tiểu học">Tiểu học</MenuItem>
                  <MenuItem value="THCS">THCS</MenuItem>
                  <MenuItem value="THPT">THPT</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Thời gian (phút)"
                  name="duration"
                  required
                  value={formData.duration}
                  onChange={handleInputChange}
                  variant="outlined"
                  helperText="Tự động điều chỉnh theo cấp học"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Mẫu giáo án"
                  name="template"
                  required
                  value={formData.template}
                  onChange={handleInputChange}
                  variant="outlined"
                >
                  <MenuItem value="2345">Công văn 2345</MenuItem>
                  <MenuItem value="5512">Công văn 5512</MenuItem>
                  <MenuItem value="1001">Công văn 1001</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên bài giảng/Chủ đề"
                  name="lessonTitle"
                  required
                  value={formData.lessonTitle}
                  onChange={handleInputChange}
                  placeholder="VD: Bài 10: Quả Hồng của Thỏ Con"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  sx={{
                    p: 3,
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'grey.300',
                    bgcolor: isDragging ? 'primary.50' : 'grey.50',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'grey.100',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.docx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <CloudUploadIcon 
                      sx={{ 
                        fontSize: 48, 
                        color: isDragging ? 'primary.main' : 'grey.400', 
                        mb: 2,
                        transition: 'color 0.3s',
                      }} 
                    />
                    <Typography variant="body1" fontWeight="medium" gutterBottom>
                      {isDragging ? 'Thả file vào đây' : 'Click để chọn file hoặc kéo thả vào đây'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      JPG, PNG, PDF, DOCX (tối đa 10MB mỗi file)
                    </Typography>
                  </Box>
                </Paper>

                {files.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Đã chọn {files.length} file(s):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {files.map((file, index) => (
                        <Chip
                          key={index}
                          icon={<DescriptionIcon />}
                          label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                          color="primary"
                          variant="outlined"
                          onDelete={() => {
                            setFiles(files.filter((_, i) => i !== index));
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? null : <CreateIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #2563eb 30%, #6366f1 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)',
                    },
                  }}
                >
                  {loading ? 'Đang tạo giáo án...' : 'Tạo Giáo Án'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateLessonPlan;

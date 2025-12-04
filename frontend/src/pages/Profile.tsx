import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Paper,
  Box,
  Avatar,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import PasswordInput from "../components/PasswordInput";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  avatar?: string;
  googleId?: string;
  hasPassword?: boolean;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [hasPasswordState, setHasPasswordState] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Set password state (for Google accounts)
  const [setPasswordValue, setSetPasswordValue] = useState("");
  const [confirmSetPassword, setConfirmSetPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        const userData = response.data.user;
        setProfile(userData);
        setEditName(userData.name);
        setHasPasswordState(!!userData.hasPassword);
        // Reset password fields when profile changes
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSetPasswordValue("");
        setConfirmSetPassword("");
      } catch (error: any) {
        toast.error("Lỗi khi tải thông tin profile");
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await axios.put("/api/auth/profile", {
        name: editName.trim(),
      });
      setProfile(response.data.user);
      setIsEditingProfile(false);
      toast.success("Cập nhật profile thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      await axios.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSetPassword = async () => {
    if (!setPasswordValue || !confirmSetPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (setPasswordValue !== confirmSetPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }

    setSettingPassword(true);
    try {
      const response = await axios.put("/api/auth/set-password", {
        newPassword: setPasswordValue,
      });
      toast.success("Đặt mật khẩu thành công");
      setSetPasswordValue("");
      setConfirmSetPassword("");

      // Cập nhật lại profile và đảm bảo hasPassword = true để UI chuyển sang "Đổi mật khẩu"
      if (response.data.user) {
        setProfile((prev) => {
          const updated = response.data.user;
          return {
            ...prev,
            ...updated,
            hasPassword: true,
          } as UserProfile;
        });
        setHasPasswordState(true);
      } else {
        // Fallback: Refresh profile để đồng bộ hasPassword
        const refreshResponse = await axios.get("/api/auth/me");
        setProfile((prev) => ({
          ...(prev as UserProfile),
          ...refreshResponse.data.user,
          hasPassword: true,
        }));
        setHasPasswordState(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đặt mật khẩu");
    } finally {
      setSettingPassword(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="md"
        sx={{ py: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Không thể tải thông tin profile</Alert>
      </Container>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isGoogleAccount = !!profile.googleId;
  const showSetPassword = isGoogleAccount && !hasPasswordState;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              mx: "auto",
              mb: 2,
              background: "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
              fontSize: "3rem",
              boxShadow: 4,
            }}
            src={profile.avatar}
          >
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {profile.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isGoogleAccount && (
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width="16"
                  height="16"
                />
                Tài khoản Google
              </Box>
            )}
            {!isGoogleAccount && "Thông tin tài khoản"}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="Thông tin cá nhân"
            />
            <Tab
              icon={<LockIcon />}
              iconPosition="start"
              label={showSetPassword ? "Đặt mật khẩu" : "Đổi mật khẩu"}
            />
          </Tabs>
        </Box>

        {/* Tab 0: Profile Information */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Typography variant="h6" fontWeight="bold">
                        Thông tin cá nhân
                      </Typography>
                    </Box>
                    {!isEditingProfile ? (
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditingProfile(true)}
                        variant="outlined"
                        size="small"
                      >
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          variant="contained"
                          size="small"
                          disabled={savingProfile}
                        >
                          {savingProfile ? (
                            <CircularProgress size={16} />
                          ) : (
                            "Lưu"
                          )}
                        </Button>
                        <Button
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setIsEditingProfile(false);
                            setEditName(profile.name);
                          }}
                          variant="outlined"
                          size="small"
                          disabled={savingProfile}
                        >
                          Hủy
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Họ và tên"
                        value={isEditingProfile ? editName : profile.name}
                        onChange={(e) => setEditName(e.target.value)}
                        InputProps={{
                          readOnly: !isEditingProfile,
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profile.email}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        helperText="Email không thể thay đổi"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <PersonIcon sx={{ mr: 2, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight="bold">
                      Thông tin tài khoản
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ID người dùng"
                        value={profile._id || "N/A"}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        helperText="Mã định danh duy nhất của tài khoản"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ngày tạo tài khoản"
                        value={formatDate(profile.createdAt)}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Password Management */}
        {tabValue === 1 && (
          <Box>
            {showSetPassword ? (
              // Set Password (for Google accounts without password)
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <LockIcon sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Đặt mật khẩu
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Tài khoản của bạn được đăng ký bằng Google và chưa có mật
                  khẩu. Bạn có thể đặt mật khẩu để đăng nhập bằng email và mật
                  khẩu.
                </Alert>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <PasswordInput
                    label="Mật khẩu mới"
                    value={setPasswordValue}
                    onChange={(e) => setSetPasswordValue(e.target.value)}
                    showStrength={true}
                    required
                  />
                  <PasswordInput
                    label="Xác nhận mật khẩu"
                    value={confirmSetPassword}
                    onChange={(e) => setConfirmSetPassword(e.target.value)}
                    confirmPassword={setPasswordValue}
                    required
                  />
                  <Button
                    variant="contained"
                    onClick={handleSetPassword}
                    disabled={
                      settingPassword ||
                      !setPasswordValue ||
                      !confirmSetPassword
                    }
                    startIcon={
                      settingPassword ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    sx={{ mt: 2 }}
                  >
                    {settingPassword ? "Đang xử lý..." : "Đặt mật khẩu"}
                  </Button>
                </Box>
              </Card>
            ) : (
              // Change Password (for accounts with password)
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <LockIcon sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Đổi mật khẩu
                  </Typography>
                </Box>
                {isGoogleAccount && profile.hasPassword && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Bạn đã đặt mật khẩu cho tài khoản này. Bây giờ bạn cần nhập
                    mật khẩu hiện tại để đổi mật khẩu.
                  </Alert>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <PasswordInput
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <PasswordInput
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    showStrength={true}
                    required
                  />
                  <PasswordInput
                    label="Xác nhận mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    confirmPassword={newPassword}
                    required
                  />
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmNewPassword
                    }
                    startIcon={
                      changingPassword ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    sx={{ mt: 2 }}
                  >
                    {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </Button>
                </Box>
              </Card>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;

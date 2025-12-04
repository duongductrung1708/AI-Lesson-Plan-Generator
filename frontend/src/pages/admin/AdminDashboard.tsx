import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Switch,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Avatar,
  Fade,
  Grow,
  Divider,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  People,
  ReceiptLong,
  Description,
  Insights,
  Search as SearchIcon,
  ShowChart,
  Logout,
  Visibility,
  Edit,
  Add,
  Delete,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import hanaiLogo from "../../assets/logo/hanai_logo.png";
import brandNameLogo from "../../assets/logo/brand_name.png";

const drawerWidth = 220;

interface AdminStats {
  userCount: number;
  lessonPlanCount: number;
  activeSubscriptions: number;
  trialUsers: number;
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "stats" | "users" | "subscriptions" | "lessonPlans"
  >("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [lessonPage, setLessonPage] = useState(0);
  const [lessonRowsPerPage, setLessonRowsPerPage] = useState(10);
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<
    "" | "active" | "expired" | "cancelled"
  >("");
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [createSubEmail, setCreateSubEmail] = useState("");
  const [createSubDuration, setCreateSubDuration] = useState<1 | 6 | 12>(1);
  const [createSubPaymentStatus, setCreateSubPaymentStatus] = useState<
    "pending" | "paid" | "failed"
  >("paid");
  const [editSubOpen, setEditSubOpen] = useState(false);
  const [editSub, setEditSub] = useState<any | null>(null);
  const [editSubDuration, setEditSubDuration] = useState<1 | 6 | 12 | "">("");
  const [editSubStatus, setEditSubStatus] = useState<
    "active" | "expired" | "cancelled"
  >("active");
  const [editSubPaymentStatus, setEditSubPaymentStatus] = useState<
    "pending" | "paid" | "failed"
  >("paid");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!user.isAdmin) {
      navigate("/");
      toast.error("Bạn không có quyền truy cập trang quản trị.");
      return;
    }
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/admin/stats");
      setStats(res.data);
    } catch {
      toast.error("Không tải được thống kê.");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data.users || []);
    } catch {
      toast.error("Không tải được danh sách người dùng.");
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get("/api/admin/subscriptions");
      setSubscriptions(res.data.subscriptions || []);
    } catch {
      toast.error("Không tải được danh sách gói.");
    }
  };

  const fetchLessonPlans = async () => {
    try {
      const res = await axios.get("/api/admin/lesson-plans");
      setLessonPlans(res.data.lessonPlans || []);
    } catch {
      toast.error("Không tải được danh sách giáo án.");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSubscriptions();
    fetchLessonPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleUserActive = async (id: string, isActive: boolean) => {
    try {
      const res = await axios.patch(`/api/admin/users/${id}/status`, {
        isActive: !isActive,
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
      toast.success("Cập nhật trạng thái người dùng thành công.");
    } catch {
      toast.error("Không cập nhật được trạng thái người dùng.");
    }
  };

  const handleCancelSubscription = async (id: string) => {
    try {
      const res = await axios.patch(`/api/admin/subscriptions/${id}/cancel`);
      setSubscriptions((prev) =>
        prev.map((s) => (s._id === id ? res.data.subscription : s))
      );
      toast.success("Đã hủy gói đăng ký.");
    } catch {
      toast.error("Không hủy được gói.");
    }
  };

  const openCreateSubscription = () => {
    setCreateSubEmail("");
    setCreateSubDuration(1);
    setCreateSubPaymentStatus("paid");
    setCreateSubOpen(true);
  };

  const handleCreateSubscription = async () => {
    if (!createSubEmail.trim()) {
      toast.error("Vui lòng nhập email người dùng.");
      return;
    }

    try {
      const res = await axios.post("/api/admin/subscriptions", {
        email: createSubEmail.trim(),
        duration: createSubDuration,
        paymentStatus: createSubPaymentStatus,
      });
      const sub = res.data.subscription;
      setSubscriptions((prev) => {
        const existsIndex = prev.findIndex((s) => s._id === sub._id);
        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = sub;
          return copy;
        }
        return [sub, ...prev];
      });
      toast.success("Tạo/cập nhật gói thành công.");
      setCreateSubOpen(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không tạo được gói cho người dùng này."
      );
    }
  };

  const openEditSubscription = (sub: any) => {
    setEditSub(sub);
    setEditSubDuration(sub.duration ?? "");
    setEditSubStatus(sub.status);
    setEditSubPaymentStatus(sub.paymentStatus);
    setEditSubOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!editSub?._id) return;

    try {
      const res = await axios.patch(`/api/admin/subscriptions/${editSub._id}`, {
        duration: editSubDuration === "" ? undefined : Number(editSubDuration),
        status: editSubStatus,
        paymentStatus: editSubPaymentStatus,
      });
      const updated = res.data.subscription;
      setSubscriptions((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s))
      );
      toast.success("Cập nhật gói thành công.");
      setEditSubOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không cập nhật được gói.");
    }
  };

  // plan config helpers đã được bỏ (tab cấu hình gói đã xóa)

  const openViewUser = (userData: any) => {
    setSelectedUser(userData);
    setViewUserOpen(true);
  };

  const openEditUser = (userData: any) => {
    setSelectedUser(userData);
    setEditName(userData.name || "");
    setEditIsAdmin(!!userData.isAdmin);
    setEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser?._id) return;

    if (!editName.trim()) {
      toast.error("Tên người dùng không được để trống.");
      return;
    }

    try {
      const res = await axios.patch(`/api/admin/users/${selectedUser._id}`, {
        name: editName.trim(),
        isAdmin: editIsAdmin,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? res.data.user : u))
      );
      toast.success("Cập nhật thông tin người dùng thành công.");
      setEditUserOpen(false);
    } catch {
      toast.error("Không cập nhật được thông tin người dùng.");
    }
  };

  const handleDeleteLessonPlan = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa giáo án này?")) return;
    try {
      await axios.delete(`/api/admin/lesson-plans/${id}`);
      setLessonPlans((prev) => prev.filter((p) => p._id !== id));
      toast.success("Đã xóa giáo án.");
    } catch {
      toast.error("Không xóa được giáo án.");
    }
  };

  const drawer = (
    <Box
      sx={{ mt: 8, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          BẢNG ĐIỀU KHIỂN
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        <ListItemButton
          selected={selectedTab === "stats"}
          onClick={() => setSelectedTab("stats")}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            "&.Mui-selected": {
              bgcolor: "primary.50",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
          }}
        >
          <ListItemIcon>
            <Insights fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Thống kê" />
        </ListItemButton>
        <ListItemButton
          selected={selectedTab === "users"}
          onClick={() => setSelectedTab("users")}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            "&.Mui-selected": {
              bgcolor: "primary.50",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
          }}
        >
          <ListItemIcon>
            <People fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Người dùng" />
        </ListItemButton>
        <ListItemButton
          selected={selectedTab === "subscriptions"}
          onClick={() => setSelectedTab("subscriptions")}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            "&.Mui-selected": {
              bgcolor: "primary.50",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
          }}
        >
          <ListItemIcon>
            <ReceiptLong fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Gói dịch vụ" />
        </ListItemButton>
        <ListItemButton
          selected={selectedTab === "lessonPlans"}
          onClick={() => setSelectedTab("lessonPlans")}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            "&.Mui-selected": {
              bgcolor: "primary.50",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
          }}
        >
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Giáo án" />
        </ListItemButton>
      </List>
      <Box sx={{ px: 2, py: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          HANG. © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );

  const renderStats = () => {
    const totalUsers = stats?.userCount ?? 0;
    const trialUsers = stats?.trialUsers ?? 0;
    const activeSubs = stats?.activeSubscriptions ?? 0;
    const lessonCount = stats?.lessonPlanCount ?? 0;

    const trialPercent =
      totalUsers > 0 ? Math.round((trialUsers / totalUsers) * 100) : 0;
    const subPercent =
      totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 100) : 0;

    return (
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3, gap: 2, flexWrap: "wrap" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={hanaiLogo}
              alt="HANAi"
              sx={{
                width: 40,
                height: 40,
                boxShadow: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Xin chào, {user?.name || "Admin"} 👋
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bảng điều khiển thống kê hoạt động hệ thống.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ height: 32, display: "flex", alignItems: "center" }}>
            <img
              src={brandNameLogo}
              alt="Brand Name"
              style={{ height: "100%", objectFit: "contain", display: "block" }}
            />
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Grow in timeout={400}>
            <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Tổng người dùng
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalUsers || "-"}
              </Typography>
            </Paper>
          </Grow>
          <Grow in timeout={500}>
            <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Tổng giáo án
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {lessonCount || "-"}
              </Typography>
            </Paper>
          </Grow>
          <Grow in timeout={600}>
            <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Gói đang hoạt động
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {activeSubs || "-"}
              </Typography>
            </Paper>
          </Grow>
          <Grow in timeout={700}>
            <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Người dùng dùng thử
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {trialUsers || "-"}
              </Typography>
            </Paper>
          </Grow>
        </Stack>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            mt: 1,
            borderRadius: 3,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ShowChart color="primary" />
              <Typography variant="h6">Tỷ lệ chuyển đổi</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Tương quan người dùng dùng thử, có gói và tổng user
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
              height: 180,
            }}
          >
            {[
              { label: "Dùng thử", value: trialPercent, color: "#22c55e" },
              { label: "Có gói", value: subPercent, color: "#3b82f6" },
              {
                label: "Còn lại",
                value: 100 - Math.min(trialPercent + subPercent, 100),
                color: "#e5e7eb",
              },
            ].map((item) => (
              <Box key={item.label} sx={{ flex: 1, textAlign: "center" }}>
                <Box
                  sx={{
                    mx: "auto",
                    width: 32,
                    height: `${Math.max(item.value, 5)}%`,
                    maxHeight: 160,
                    borderRadius: 2,
                    bgcolor: item.color,
                    transition: "height 0.4s ease",
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.value}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderUsers = () => {
    const filtered = users.filter((u) => {
      const query = userSearch.toLowerCase();
      return (
        u.email?.toLowerCase().includes(query) ||
        u.name?.toLowerCase().includes(query)
      );
    });
    const paged = filtered.slice(
      userPage * userRowsPerPage,
      userPage * userRowsPerPage + userRowsPerPage
    );

    const handleChangePage = (_: unknown, newPage: number) => {
      setUserPage(newPage);
    };

    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setUserRowsPerPage(parseInt(event.target.value, 10));
      setUserPage(0);
    };

    return (
      <Box sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          mb={2}
          spacing={2}
        >
          <Typography variant="h5">Quản lý người dùng</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Tìm theo email hoặc tên..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="outlined" onClick={fetchUsers}>
              Tải lại
            </Button>
          </Stack>
        </Stack>
        <Paper>
          <Fade in timeout={300}>
            <Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Hoạt động</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Chip label="Admin" color="primary" size="small" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.isActive}
                          onChange={() =>
                            handleToggleUserActive(u._id, u.isActive)
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => openViewUser(u)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa thông tin">
                            <IconButton
                              size="small"
                              onClick={() => openEditUser(u)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filtered.length}
                page={userPage}
                onPageChange={handleChangePage}
                rowsPerPage={userRowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>
          </Fade>
        </Paper>
      </Box>
    );
  };

  const renderSubscriptions = () => {
    const filtered = subscriptions.filter((s) => {
      const query = subscriptionSearch.toLowerCase();
      const matchText =
        s.userId?.email?.toLowerCase().includes(query) ||
        s.userId?.name?.toLowerCase().includes(query);
      const matchStatus =
        !subscriptionStatusFilter || s.status === subscriptionStatusFilter;
      return matchText && matchStatus;
    });

    return (
      <Box sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          mb={2}
          spacing={2}
        >
          <Typography variant="h5">Quản lý gói dịch vụ (trả phí)</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Tìm theo email hoặc tên..."
              value={subscriptionSearch}
              onChange={(e) => setSubscriptionSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Trạng thái"
              value={subscriptionStatusFilter}
              onChange={(e) =>
                setSubscriptionStatusFilter(e.target.value as any)
              }
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="expired">Đã hết hạn</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={fetchSubscriptions}>
              Tải lại
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateSubscription}
            >
              Tạo / cấp gói
            </Button>
          </Stack>
        </Stack>
        <Paper>
          <Fade in timeout={300}>
            <Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Người dùng</TableCell>
                    <TableCell>Gói (tháng)</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thanh toán</TableCell>
                    <TableCell>Hết hạn</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s._id} hover>
                      <TableCell>{s.userId?.email}</TableCell>
                      <TableCell>{s.duration ?? "-"}</TableCell>
                      <TableCell>{s.status}</TableCell>
                      <TableCell>{s.paymentStatus}</TableCell>
                      <TableCell>
                        {s.endDate
                          ? new Date(s.endDate).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Chỉnh sửa gói">
                            <IconButton
                              size="small"
                              onClick={() => openEditSubscription(s)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy gói">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelSubscription(s._id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Fade>
        </Paper>
      </Box>
    );
  };

  const renderLessonPlans = () => {
    const filtered = lessonPlans.filter((p) => {
      const query = lessonSearch.toLowerCase();
      return (
        p.lessonTitle?.toLowerCase().includes(query) ||
        p.teacherName?.toLowerCase().includes(query) ||
        p.subject?.toLowerCase().includes(query) ||
        p.userId?.email?.toLowerCase().includes(query)
      );
    });

    const paged = filtered.slice(
      lessonPage * lessonRowsPerPage,
      lessonPage * lessonRowsPerPage + lessonRowsPerPage
    );

    const handleChangePage = (_: unknown, newPage: number) => {
      setLessonPage(newPage);
    };

    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setLessonRowsPerPage(parseInt(event.target.value, 10));
      setLessonPage(0);
    };

    return (
      <Box sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          mb={2}
          spacing={2}
        >
          <Typography variant="h5">Giáo án</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Tìm theo tiêu đề, giáo viên, môn hoặc email..."
              value={lessonSearch}
              onChange={(e) => {
                setLessonSearch(e.target.value);
                setLessonPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="outlined" onClick={fetchLessonPlans}>
              Tải lại
            </Button>
          </Stack>
        </Stack>
        <Paper>
          <Fade in timeout={300}>
            <Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tiêu đề</TableCell>
                    <TableCell>Giáo viên</TableCell>
                    <TableCell>Môn</TableCell>
                    <TableCell>Người dùng</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((p) => (
                    <TableRow key={p._id} hover>
                      <TableCell>{p.lessonTitle}</TableCell>
                      <TableCell>{p.teacherName}</TableCell>
                      <TableCell>{p.subject}</TableCell>
                      <TableCell>{p.userId?.email}</TableCell>
                      <TableCell>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLessonPlan(p._id)}
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filtered.length}
                page={lessonPage}
                onPageChange={handleChangePage}
                rowsPerPage={lessonRowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>
          </Fade>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
          backdropFilter: "blur(12px)",
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              src={hanaiLogo}
              alt="HANAi"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            />
            <Box>
              <Typography variant="h6" noWrap component="div">
                Admin Dashboard
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ ml: 2 }}
          >
            <Box
              sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}
            >
              <Typography variant="body2" fontWeight={500}>
                {user?.name || "Admin"}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 14,
              }}
            >
              {(user?.name || "A").charAt(0).toUpperCase()}
            </Avatar>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="admin navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "#ffffff",
              color: "#0f172a",
              borderRight: "1px solid rgba(148,163,184,0.5)",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "#ffffff",
              color: "#0f172a",
              borderRight: "1px solid rgba(148,163,184,0.5)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "#f3f4f6",
          minHeight: "calc(100vh - 64px)", // 64px ~ chiều cao AppBar (mt: 8)
        }}
      >
        <Container maxWidth="lg">
          {selectedTab === "stats" && renderStats()}
          {selectedTab === "users" && renderUsers()}
          {selectedTab === "subscriptions" && renderSubscriptions()}
          {selectedTab === "lessonPlans" && renderLessonPlans()}
        </Container>

        {/* View user dialog */}
        <Dialog
          open={viewUserOpen}
          onClose={() => setViewUserOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Thông tin người dùng</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <Typography variant="body2">
                <strong>Email:</strong> {selectedUser?.email || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Tên:</strong> {selectedUser?.name || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Quyền:</strong>{" "}
                {selectedUser?.isAdmin ? "Admin" : "User thường"}
              </Typography>
              <Typography variant="body2">
                <strong>Trạng thái:</strong>{" "}
                {selectedUser?.isActive ? "Đang hoạt động" : "Đã khóa"}
              </Typography>
              {selectedUser?.createdAt && (
                <Typography variant="body2">
                  <strong>Ngày tạo:</strong>{" "}
                  {new Date(selectedUser.createdAt).toLocaleString("vi-VN")}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewUserOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Edit user dialog */}
        <Dialog
          open={editUserOpen}
          onClose={() => setEditUserOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email"
                value={selectedUser?.email || ""}
                fullWidth
                disabled
              />
              <TextField
                label="Tên"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
              />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                />
                <Typography>Quyền admin</Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserOpen(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleUpdateUser}>
              Lưu thay đổi
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create subscription dialog */}
        <Dialog
          open={createSubOpen}
          onClose={() => setCreateSubOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Tạo / cấp gói dịch vụ</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email người dùng"
                value={createSubEmail}
                onChange={(e) => setCreateSubEmail(e.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Thời hạn gói (tháng)"
                value={createSubDuration}
                onChange={(e) =>
                  setCreateSubDuration(Number(e.target.value) as 1 | 6 | 12)
                }
                fullWidth
              >
                <MenuItem value={1}>1 tháng</MenuItem>
                <MenuItem value={6}>6 tháng</MenuItem>
                <MenuItem value={12}>12 tháng</MenuItem>
              </TextField>
              <TextField
                select
                label="Trạng thái thanh toán"
                value={createSubPaymentStatus}
                onChange={(e) =>
                  setCreateSubPaymentStatus(
                    e.target.value as "pending" | "paid" | "failed"
                  )
                }
                fullWidth
              >
                <MenuItem value="pending">Chờ thanh toán</MenuItem>
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="failed">Thất bại</MenuItem>
              </TextField>
              <Typography variant="caption" color="text.secondary">
                Lưu ý: Nếu user đã có gói, thao tác này sẽ cập nhật lại gói hiện
                tại theo thông tin mới.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateSubOpen(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleCreateSubscription}>
              Lưu gói
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit subscription dialog */}
        <Dialog
          open={editSubOpen}
          onClose={() => setEditSubOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email người dùng"
                value={editSub?.userId?.email || ""}
                fullWidth
                disabled
              />
              <TextField
                select
                label="Thời hạn gói (tháng)"
                value={editSubDuration}
                onChange={(e) =>
                  setEditSubDuration(
                    e.target.value === ""
                      ? ""
                      : (Number(e.target.value) as 1 | 6 | 12)
                  )
                }
                fullWidth
              >
                <MenuItem value="">Giữ nguyên</MenuItem>
                <MenuItem value={1}>1 tháng</MenuItem>
                <MenuItem value={6}>6 tháng</MenuItem>
                <MenuItem value={12}>12 tháng</MenuItem>
              </TextField>
              <TextField
                select
                label="Trạng thái gói"
                value={editSubStatus}
                onChange={(e) =>
                  setEditSubStatus(
                    e.target.value as "active" | "expired" | "cancelled"
                  )
                }
                fullWidth
              >
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="expired">Đã hết hạn</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </TextField>
              <TextField
                select
                label="Trạng thái thanh toán"
                value={editSubPaymentStatus}
                onChange={(e) =>
                  setEditSubPaymentStatus(
                    e.target.value as "pending" | "paid" | "failed"
                  )
                }
                fullWidth
              >
                <MenuItem value="pending">Chờ thanh toán</MenuItem>
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="failed">Thất bại</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSubOpen(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleUpdateSubscription}>
              Lưu thay đổi
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

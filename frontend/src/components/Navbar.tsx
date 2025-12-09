import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  Folder as FolderIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  HelpOutline as HelpOutlineIcon,
  Gavel as GavelIcon,
  BugReport as BugReportIcon,
  KeyboardAlt as KeyboardAltIcon,
  AutoStories as AutoStoriesIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import hanaiLogo from "../assets/logo/hanai_logo.png";
import brandNameLogo from "../assets/logo/brand_name.png";
import { useThemeMode } from "../contexts/ThemeModeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<null | HTMLElement>(null);
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: "",
    email: user?.email || "",
    description: "",
  });
  const [bugErrors, setBugErrors] = useState<{
    title?: string;
    email?: string;
    description?: string;
  }>({});

  const handleGoAdmin = () => {
    if (!user?.isAdmin) {
      toast.error("Bạn không có quyền truy cập trang quản trị.");
      return;
    }
    navigate("/admin");
  };

  useEffect(() => {
    setBugForm((prev) => ({
      ...prev,
      email: user?.email || "",
    }));
  }, [user?.email]);
  const handleHelpOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleHelpClose = () => {
    setHelpAnchorEl(null);
  };

  const handleReportBugOpen = () => {
    setBugErrors({});
    setBugForm({
      title: "",
      email: user?.email || "",
      description: "",
    });
    setReportBugOpen(true);
  };

  const handleReportBugClose = () => {
    setReportBugOpen(false);
  };

  const handleReportBugSubmit = async () => {
    const errors: typeof bugErrors = {};
    if (!bugForm.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề lỗi";
    }
    const emailValue = bugForm.email.trim();
    if (!emailValue) {
      errors.email = "Vui lòng nhập email liên hệ";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(emailValue)) {
      errors.email = "Email không hợp lệ";
    }
    if (!bugForm.description.trim()) {
      errors.description = "Vui lòng mô tả lỗi bạn gặp";
    }

    if (Object.keys(errors).length) {
      setBugErrors(errors);
      return;
    }

    try {
      const payload = {
        title: bugForm.title.trim(),
        message: bugForm.description.trim(),
        email: emailValue,
        name: user?.name || "Người dùng",
      };

      // ưu tiên gửi qua endpoint yêu cầu đăng nhập; fallback public nếu bị 401/403
      try {
        await axios.post("/api/reports", payload, { withCredentials: true });
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          await axios.post("/api/reports/public", payload);
        } else {
          throw err;
        }
      }

      toast.success("Đã gửi báo cáo tới admin. Cảm ơn bạn!");
      setReportBugOpen(false);
    } catch (error) {
      console.error("Report bug error:", error);
      toast.error("Gửi báo cáo không thành công. Vui lòng thử lại.");
    }
  };

  const helpLinks = [
    {
      label: "Trung tâm trợ giúp",
      icon: <HelpOutlineIcon sx={{ mr: 2, fontSize: 20 }} />,
      to: "/help-center",
    },
    {
      label: "Ghi chú phiên bản",
      icon: <AutoStoriesIcon sx={{ mr: 2, fontSize: 20 }} />,
      to: "/release-notes",
    },
    {
      label: "Điều khoản & Chính sách",
      icon: <GavelIcon sx={{ mr: 2, fontSize: 20 }} />,
      to: "/terms-policies",
    },
    {
      label: "Phím tắt bàn phím",
      icon: <KeyboardAltIcon sx={{ mr: 2, fontSize: 20 }} />,
      to: "/keyboard-shortcuts",
    },
  ];

  // Check if a path is active
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
    setAnchorEl(null);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        backgroundColor:
          mode === "dark"
            ? "rgba(15, 23, 42, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
        borderRadius: 0,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Box
            sx={{ mr: 1, boxShadow: 2, borderRadius: 2, overflow: "hidden" }}
          >
            <img
              src={hanaiLogo as string}
              alt="HANAi Logo"
              style={{
                width: 40,
                height: 40,
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
          <Box
            sx={{
              height: 32,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={brandNameLogo as string}
              alt="Brand Name"
              style={{
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
        </Box>

        {!isMobile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {user ? (
              <>
                <Button
                  component={Link}
                  to="/create"
                  startIcon={<CreateIcon />}
                  sx={{
                    color: "text.primary",
                    borderBottom: isActive("/create") ? "2px solid" : "none",
                    borderColor: isActive("/create")
                      ? "primary.main"
                      : "transparent",
                    borderRadius: 0,
                    fontWeight: isActive("/create") ? "bold" : "normal",
                    "&:hover": {
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  Tạo Giáo Án
                </Button>
                <Button
                  component={Link}
                  to="/my-documents"
                  startIcon={<FolderIcon />}
                  sx={{
                    color: "text.primary",
                    borderBottom: isActive("/my-documents")
                      ? "2px solid"
                      : "none",
                    borderColor: isActive("/my-documents")
                      ? "primary.main"
                      : "transparent",
                    borderRadius: 0,
                    fontWeight: isActive("/my-documents") ? "bold" : "normal",
                    "&:hover": {
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  Tài Liệu
                </Button>
                <Button
                  onClick={handleHelpOpen}
                  startIcon={<HelpOutlineIcon />}
                  sx={{
                    color: "text.primary",
                    borderBottom: "none",
                    fontWeight: "normal",
                    "&:hover": {
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  Trợ giúp
                </Button>
                <IconButton
                  onClick={toggleMode}
                  sx={{
                    color: "text.primary",
                  }}
                  aria-label="Chuyển chế độ sáng/tối"
                >
                  {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
                <Box
                  sx={{
                    ml: 2,
                    pl: 2,
                    borderLeft: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    onClick={handleProfileClick}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      borderRadius: 2,
                      px: 1,
                      py: 0.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <IconButton size="small" sx={{ p: 0 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background:
                            "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        display: { lg: "block", xl: "block" },
                        color: "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      {user.name}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Button
                  onClick={handleHelpOpen}
                  startIcon={<HelpOutlineIcon />}
                  sx={{ color: "text.primary" }}
                >
                  Trợ giúp
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  sx={{ color: "text.primary" }}
                >
                  Đăng nhập
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    background:
                      "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1d4ed8 30%, #4f46e5 90%)",
                    },
                  }}
                >
                  Đăng ký
                </Button>
                <IconButton
                  onClick={toggleMode}
                  sx={{ color: "text.primary" }}
                  aria-label="Chuyển chế độ sáng/tối"
                >
                  {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </>
            )}
          </Box>
        ) : (
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              boxShadow: 3,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="body2" fontWeight="bold">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <MenuItem
            component={Link}
            to="/profile"
            onClick={handleProfileClose}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Hồ sơ</Typography>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/billing"
            onClick={handleProfileClose}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <CreditCardIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Thanh toán</Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              handleProfileClose();
              handleLogout();
            }}
            sx={{
              py: 1.5,
              color: "error.main",
              "&:hover": {
                bgcolor: "error.lighter",
                color: "error.dark",
              },
            }}
          >
            <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Đăng xuất</Typography>
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={helpAnchorEl}
          open={Boolean(helpAnchorEl)}
          onClose={handleHelpClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 240,
              boxShadow: 3,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="overline" color="text.secondary">
              Trợ giúp
            </Typography>
          </Box>
          {helpLinks.map((item) => (
            <MenuItem
              key={item.label}
              component={Link}
              to={item.to}
              onClick={handleHelpClose}
              sx={{
                py: 1.5,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </MenuItem>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              handleHelpClose();
              handleReportBugOpen();
            }}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <BugReportIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Báo cáo lỗi</Typography>
          </MenuItem>
        </Menu>

        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Box sx={{ width: 280 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Menu
              </Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={toggleMode}>
                  <ListItemIcon>
                    {mode === "dark" ? (
                      <LightModeIcon color="warning" />
                    ) : (
                      <DarkModeIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      mode === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
                    }
                  />
                </ListItemButton>
              </ListItem>
            </List>
            <Divider />
            {user ? (
              <>
                <Box sx={{ p: 2, bgcolor: "primary.50" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background:
                          "linear-gradient(45deg, #2563eb 30%, #6366f1 90%)",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <List>
                  {user.isAdmin && (
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => {
                          handleGoAdmin();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <ListItemText primary="Admin Dashboard" />
                      </ListItemButton>
                    </ListItem>
                  )}
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      to="/create"
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{
                        borderBottom: isActive("/create")
                          ? "2px solid"
                          : "none",
                        borderColor: isActive("/create")
                          ? "primary.main"
                          : "transparent",
                        bgcolor: isActive("/create")
                          ? "action.selected"
                          : "transparent",
                        fontWeight: isActive("/create") ? "bold" : "normal",
                      }}
                    >
                      <CreateIcon sx={{ mr: 2 }} />
                      <ListItemText primary="Tạo Giáo Án" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      to="/my-documents"
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{
                        borderBottom: isActive("/my-documents")
                          ? "2px solid"
                          : "none",
                        borderColor: isActive("/my-documents")
                          ? "primary.main"
                          : "transparent",
                        bgcolor: isActive("/my-documents")
                          ? "action.selected"
                          : "transparent",
                        fontWeight: isActive("/my-documents")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      <FolderIcon sx={{ mr: 2 }} />
                      <ListItemText primary="Tài Liệu Của Tôi" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{
                        borderBottom: isActive("/profile")
                          ? "2px solid"
                          : "none",
                        borderColor: isActive("/profile")
                          ? "primary.main"
                          : "transparent",
                        bgcolor: isActive("/profile")
                          ? "action.selected"
                          : "transparent",
                        fontWeight: isActive("/profile") ? "bold" : "normal",
                      }}
                    >
                      <PersonIcon sx={{ mr: 2 }} />
                      <ListItemText primary="Hồ sơ" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      to="/billing"
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{
                        borderBottom: isActive("/billing")
                          ? "2px solid"
                          : "none",
                        borderColor: isActive("/billing")
                          ? "primary.main"
                          : "transparent",
                        bgcolor: isActive("/billing")
                          ? "action.selected"
                          : "transparent",
                        fontWeight: isActive("/billing") ? "bold" : "normal",
                      }}
                    >
                      <CreditCardIcon sx={{ mr: 2 }} />
                      <ListItemText primary="Thanh toán" />
                    </ListItemButton>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 2 }} />
                      <ListItemText primary="Đăng xuất" />
                    </ListItemButton>
                  </ListItem>
                </List>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Trợ giúp
                  </Typography>
                </Box>
                <List>
                  {helpLinks.map((item) => (
                    <ListItem disablePadding key={item.label}>
                      <ListItemButton
                        component={Link}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleReportBugOpen();
                      }}
                    >
                      <ListItemText primary="Báo cáo lỗi" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </>
            ) : (
              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ListItemText primary="Đăng nhập" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ListItemText primary="Đăng ký" />
                  </ListItemButton>
                </ListItem>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Trợ giúp
                  </Typography>
                </Box>
                {helpLinks.map((item) => (
                  <ListItem disablePadding key={item.label}>
                    <ListItemButton
                      component={Link}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleReportBugOpen();
                    }}
                  >
                    <ListItemText primary="Báo cáo lỗi" />
                  </ListItemButton>
                </ListItem>
              </List>
            )}
          </Box>
        </Drawer>
        <Dialog
          open={reportBugOpen}
          onClose={handleReportBugClose}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Báo cáo lỗi</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Vui lòng mô tả chi tiết sự cố. Chúng tôi sẽ phản hồi qua email của
              bạn.
            </Typography>
            <TextField
              label="Tiêu đề"
              value={bugForm.title}
              onChange={(e) => {
                setBugForm({ ...bugForm, title: e.target.value });
                if (bugErrors.title) {
                  setBugErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              error={!!bugErrors.title}
              helperText={bugErrors.title}
              fullWidth
            />
            <TextField
              label="Email liên hệ"
              type="email"
              value={bugForm.email}
              onChange={(e) => {
                setBugForm({ ...bugForm, email: e.target.value });
                if (bugErrors.email) {
                  setBugErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={!!bugErrors.email}
              helperText={bugErrors.email}
              fullWidth
            />
            <TextField
              label="Mô tả lỗi"
              value={bugForm.description}
              onChange={(e) => {
                setBugForm({ ...bugForm, description: e.target.value });
                if (bugErrors.description) {
                  setBugErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              error={!!bugErrors.description}
              helperText={bugErrors.description}
              fullWidth
              multiline
              minRows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReportBugClose}>Hủy</Button>
            <Button variant="contained" onClick={handleReportBugSubmit}>
              Gửi
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

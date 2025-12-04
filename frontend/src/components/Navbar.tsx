import { useState } from "react";
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
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  Folder as FolderIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
const hanaiLogo = "/src/assets/logo/hanai_logo.png";
const brandNameLogo = "/src/assets/logo/brand_name.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
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
          <Box sx={{ mr: 1, boxShadow: 2, borderRadius: 2, overflow: "hidden" }}>
            <img
              src={hanaiLogo}
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
              src={brandNameLogo}
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
            <Typography variant="body2">Profile</Typography>
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
            <Typography variant="body2">Billing</Typography>
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
                      <ListItemText primary="Profile" />
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
                      <ListItemText primary="Billing" />
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
              </List>
            )}
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

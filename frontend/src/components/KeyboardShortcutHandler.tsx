import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const shortcutMap = [
  {
    key: "n",
    path: "/create",
    requiresAuth: true,
    description: "Tạo giáo án mới",
  },
  {
    key: "d",
    path: "/my-documents",
    requiresAuth: true,
    description: "Mở Tài liệu của tôi",
  },
  {
    key: "b",
    path: "/billing",
    requiresAuth: true,
    description: "Mở trang Billing",
  },
  {
    key: "h",
    path: "/help-center",
    requiresAuth: false,
    description: "Mở Help Center",
  },
  {
    key: "k",
    path: "/keyboard-shortcuts",
    requiresAuth: false,
    description: "Danh sách phím tắt",
  },
  {
    key: "r",
    path: "/release-notes",
    requiresAuth: false,
    description: "Release notes",
  },
  {
    key: "t",
    path: "/terms-policies",
    requiresAuth: false,
    description: "Terms & policies",
  },
];

const KeyboardShortcutHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.altKey || event.repeat) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const shortcut = shortcutMap.find((item) => item.key === key);
      if (!shortcut) return;

      event.preventDefault();

      if (shortcut.requiresAuth && !user) {
        navigate("/login");
        toast.error("Vui lòng đăng nhập để sử dụng phím tắt này.");
        return;
      }

      if (location.pathname !== shortcut.path) {
        navigate(shortcut.path);
      }

      toast.success(shortcut.description);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, location.pathname, user]);

  return null;
};

export default KeyboardShortcutHandler;

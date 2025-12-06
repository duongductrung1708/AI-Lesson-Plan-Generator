import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Stack,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  { action: "Tạo giáo án mới", keys: "Ctrl / Cmd + Alt + N" },
  { action: "Mở Tài liệu của tôi", keys: "Ctrl / Cmd + Alt + D" },
  { action: "Mở Billing", keys: "Ctrl / Cmd + Alt + B" },
  { action: "Help Center", keys: "Ctrl / Cmd + Alt + H" },
  { action: "Release notes", keys: "Ctrl / Cmd + Alt + R" },
  { action: "Terms & policies", keys: "Ctrl / Cmd + Alt + T" },
  { action: "Trang phím tắt", keys: "Ctrl / Cmd + Alt + K" },
];

const KeyboardShortcuts = () => {
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
        Phím tắt bàn phím
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Sử dụng phím tắt để thao tác nhanh hơn với AI Lesson Plan Generator.
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Nhấn giữ Ctrl (Windows) hoặc Cmd (macOS) cùng với phím Alt và phím chữ
        tương ứng để chuyển nhanh giữa các trang bên dưới.
      </Typography>

      <Paper elevation={3}>
        <Table>
          <TableBody>
            {shortcuts.map((shortcut) => (
              <TableRow key={shortcut.action}>
                <TableCell width="60%">
                  <Typography variant="body1" fontWeight="500">
                    {shortcut.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" color="text.secondary">
                    {shortcut.keys}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default KeyboardShortcuts;

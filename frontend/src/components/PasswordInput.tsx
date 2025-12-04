import { useState } from 'react';
import { TextField, InputAdornment, IconButton, Box, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showStrength?: boolean;
  confirmPassword?: string;
}

const PasswordInput = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  placeholder,
  disabled = false,
  showStrength = false,
  confirmPassword,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    const checks = validatePassword(password);
    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    if (passedChecks <= 2) {
      return { strength: 1, label: 'Yếu', color: '#ef4444' };
    } else if (passedChecks <= 4) {
      return { strength: 2, label: 'Trung bình', color: '#f59e0b' };
    } else {
      return { strength: 3, label: 'Mạnh', color: '#10b981' };
    }
  };

  const checks = value ? validatePassword(value) : null;
  const strength = showStrength && value ? getPasswordStrength(value) : null;
  const passwordsMatch = confirmPassword ? value === confirmPassword : true;

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        type={showPassword ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant="outlined"
        disabled={disabled}
        error={error || (confirmPassword !== undefined && !passwordsMatch && value.length > 0)}
        helperText={
          error
            ? helperText
            : confirmPassword !== undefined && !passwordsMatch && value.length > 0
            ? 'Mật khẩu không khớp'
            : helperText || ''
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                disabled={disabled}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {showStrength && value && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            {[1, 2, 3].map((level) => (
              <Box
                key={level}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 1,
                  bgcolor: strength && level <= strength.strength ? strength.color : '#e5e7eb',
                  transition: 'background-color 0.3s',
                }}
              />
            ))}
          </Box>
          {strength && (
            <Typography variant="caption" sx={{ color: strength.color, fontWeight: 500 }}>
              Độ mạnh: {strength.label}
            </Typography>
          )}
        </Box>
      )}

      {showStrength && value && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Mật khẩu phải có:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: checks?.length ? '#10b981' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {checks?.length ? '✓' : '○'} Ít nhất 6 ký tự
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: checks?.uppercase ? '#10b981' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {checks?.uppercase ? '✓' : '○'} Một chữ cái viết hoa
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: checks?.lowercase ? '#10b981' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {checks?.lowercase ? '✓' : '○'} Một chữ cái thường
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: checks?.number ? '#10b981' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {checks?.number ? '✓' : '○'} Một số
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: checks?.special ? '#10b981' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {checks?.special ? '✓' : '○'} Một ký tự đặc biệt (!@#$%^&*...)
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PasswordInput;


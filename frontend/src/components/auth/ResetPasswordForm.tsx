import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Grid,
    Typography,
    Paper,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset, AuthError } from 'firebase/auth';
import { auth } from '../../firebase';

interface ResetPasswordInputs {
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordInputs>();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode');
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!oobCode) {
      setVerificationError("Invalid password reset link: Missing code.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        console.log("[ResetPassword] Code verified for:", email);
        setVerificationError(null);
      })
      .catch((error: AuthError) => {
        console.error("[ResetPassword] Verification error:", error);
        setVerificationError(
          error.code === 'auth/expired-action-code' 
            ? "Reset link expired. Please request a new one." 
            : "Invalid reset link. Please try again."
        );
      });
  }, [oobCode]);

  const onSubmit: SubmitHandler<ResetPasswordInputs> = async (data) => {
    if (!oobCode || verificationError) {
      setSnackbarMessage("Invalid reset link");
      setShowSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.newPassword);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 5000);
    } catch (error: any) {
      console.error("[ResetPassword] Error:", error);
      setSnackbarMessage(error.message || "Password reset failed");
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  return (
    <>
      <Paper elevation={3} sx={{ padding: 3, maxWidth: 450, margin: 'auto', mt: 4 }}>
        <Typography variant="h5" align="center" mb={3}>
          Reset Password
        </Typography>

        {verificationError && (
          <Alert severity="error" sx={{ mb: 2 }}>{verificationError}</Alert>
        )}

        {isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset successfully! You will be redirected to login shortly.
          </Alert>
        )}

        {!verificationError && !isSuccess && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: value => value === newPassword || "Passwords do not match"
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Set New Password'}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default ResetPasswordForm;

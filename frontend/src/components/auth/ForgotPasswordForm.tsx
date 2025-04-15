import React, { useState } from 'react';
import {
    TextField,
    Button,
    Grid,
    Typography,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    Box
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FUNCTION_URLS } from '../../redux/api/articlesApi'; // Import the function URLs

interface ForgotPasswordInputs {
  email: string;
}

const ForgotPasswordForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit: SubmitHandler<ForgotPasswordInputs> = async (data) => {
    setLoading(true);
    setShowSnackbar(false);
    setSnackbarMessage('');
    setIsSuccess(false);
    console.log("[ForgotPassword] Sending reset request for:", data.email);

    try {
      // Call the deployed Cloud Function
      const functionUrl = FUNCTION_URLS.sendPasswordResetEmail;

      const response = await fetch(functionUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: data.email }), // Send email in body
      });

      const responseData = await response.json();

      // Cloud Function always returns 200/success:true in this case
      if (!response.ok || !responseData.success) {
         // Log error but still show success UI for security
         console.error("Error initiating password reset on backend:", responseData);
      }

      console.log("[ForgotPassword] Reset email process initiated on backend.");
      setIsSuccess(true); // Show success message UI
    } catch (error: any) {
      // Handle network errors during fetch
      console.error("[ForgotPassword] Network/Fetch Error:", error);
      // Still show generic success UI for security, maybe log differently
      setIsSuccess(true);
      // For development purposes, you might want to see actual errors:
      // setSnackbarMessage(`Error: Failed to send request. Please try again.`);
      // setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setShowSnackbar(false);
  };

  return (
    <>
      <Paper elevation={3} sx={{ padding: 3, maxWidth: 450, margin: 'auto', mt: 4 }}>
        <Typography variant="h5" align="center" mb={3}>
          Forgot Password
        </Typography>

        {isSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
                Password reset email sent successfully! Please check your inbox (and spam folder) for instructions.
            </Alert>
        ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your email address to receive a password reset link.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    type="email"
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email format",
                        },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
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
                    {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                  </Button>
                </Grid>
              </Grid>
            </form>
        )}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button component={Link} to="/login">
            Back to Login
          </Button>
        </Box>
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

export default ForgotPasswordForm;

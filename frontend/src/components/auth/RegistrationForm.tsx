import React, { useEffect } from 'react'; // Add useEffect
import {
    TextField,
    Button,
    Grid,
    Typography,
    Paper, // Import Paper
    CircularProgress,
    Snackbar
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form'; // Import useForm
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../../redux/slices/authSlice';
import { RootState, AppDispatch } from '../../redux/store';

// Define the interface for react-hook-form
interface RegistrationInputs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string; // Add this property
}

const RegistrationForm: React.FC = () => {
  // Use react-hook-form
  const { register: registerField, handleSubmit, formState: { errors } } = useForm<RegistrationInputs>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state: RootState) => state.auth); // Remove unused `error` variable
  const [showError, setShowError] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState(''); // Add snackbarMessage state

  // Use SubmitHandler from react-hook-form
  const onSubmit: SubmitHandler<RegistrationInputs> = async (data) => {
    if (data.password !== data.confirmPassword) {
       setSnackbarMessage('Passwords do not match!');
       setShowError(true);
       return;
    }
    try {
      console.log("[onSubmit] Attempting registration dispatch...");
      const resultAction = await dispatch(register(data));
      console.log("[onSubmit] Dispatch completed. Result Action:", resultAction); // Keep this log

      if (register.rejected.match(resultAction)) {
          console.error("[onSubmit] Action rejected:", resultAction.payload);
          setSnackbarMessage(resultAction.payload as string || 'Registration failed.');
          setShowError(true);
      }
      // NOTE: Navigation is now handled by useEffect below
    } catch (error: any) {
      console.error('[onSubmit] Caught error during dispatch:', error);
      setSnackbarMessage(error.message || 'An unexpected error occurred.');
      setShowError(true);
    }
  };

  // Add useEffect Hook
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log("[useEffect] isAuthenticated is true, navigating to dashboard...");
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Function to close the Snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };


  return (
    <>
      {/* Use Paper as the main form container */}
      <Paper elevation={3} sx={{ padding: 3, maxWidth: 400, margin: 'auto', mt: 4 }}>
        <Typography variant="h5" align="center" mb={3}>
          Register
        </Typography>
        {/* Use form with handleSubmit from react-hook-form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Use Grid container for layout */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="First Name"
                fullWidth
                // Use register from react-hook-form
                {...registerField("firstName", { required: "First name is required" })}
                // Connect error state from react-hook-form
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                variant="outlined" // Explicitly set variant if desired
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Last Name"
                fullWidth
                // Use register from react-hook-form
                {...registerField("lastName", { required: "Last name is required" })}
                // Connect error state from react-hook-form
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                variant="outlined" // Explicitly set variant if desired
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                fullWidth
                // Use register from react-hook-form
                {...registerField("email", {
                    required: "Email is required",
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email format",
                    },
                })}
                // Connect error state from react-hook-form
                error={!!errors.email}
                helperText={errors.email?.message}
                variant="outlined" // Explicitly set variant if desired
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                // Use register from react-hook-form
                {...registerField("password", { required: "Password is required" })}
                // Connect error state from react-hook-form
                error={!!errors.password}
                helperText={errors.password?.message}
                variant="outlined" // Explicitly set variant if desired
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                // Use register from react-hook-form
                {...registerField("confirmPassword", { required: "Please confirm your password" })}
                // Connect error state from react-hook-form
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                variant="outlined" // Explicitly set variant if desired
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading} // Use loading state from Redux
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      {/* Snackbar for displaying Redux errors */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar} // Use handler to close
        message={snackbarMessage || 'Registration failed'} // Display error from Redux state
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position Snackbar
      />
    </>
  );
};

export default RegistrationForm;
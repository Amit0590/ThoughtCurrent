import React from 'react';
import {
    TextField,
    Button,
    Grid,
    Typography,
    Paper, // Import Paper
    CircularProgress,
    Snackbar,
    Divider
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form'; // Import useForm
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Import `loginSuccess` from `authSlice.ts`
import { login } from '../../redux/slices/authSlice';
import { RootState, AppDispatch } from '../../redux/store';
import GoogleIcon from '@mui/icons-material/Google';
// Import the `signInWithGoogleRedirect` function from `firebase.js`
import { signInWithGoogleRedirect } from '../../firebase';

// Define the interface for react-hook-form
interface LoginInputs {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  // Use react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [showError, setShowError] = React.useState(false);

  // Use SubmitHandler from react-hook-form
  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    try {
      console.log("Attempting login dispatch..."); // Add log
      await dispatch(login(data)).unwrap(); // Use unwrap
      console.log("Login dispatch successful, navigating..."); // Add log
      navigate('/dashboard');
    } catch (rejectedValueOrSerializedError) {
      console.error('Login failed:', rejectedValueOrSerializedError); // Log error
      // Error is handled by the rejected case in authSlice, setting state.error
      setShowError(true); // Show the Snackbar
    }
  };

  // Define the function to handle Google Sign-in click
  const handleGoogleSignIn = async () => {
    try {
      console.log("Initiating Google Sign-in Redirect..."); // Log message
      await signInWithGoogleRedirect(); // Call the redirect version
      // No need to handle result here in the component directly with redirect flow
      // The handleRedirectResult function in firebase.js and useEffect in App.tsx will handle the result after redirect
    } catch (error) {
      console.error("Error initiating Google Sign-in Redirect:", error);
      setShowError(true); // Show Snackbar for redirect initiation errors (less common)
    }
  };

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
          Login
        </Typography>
        {/* Use form with handleSubmit from react-hook-form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Use Grid container for layout */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                fullWidth
                // Use register from react-hook-form
                {...register("email", {
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
                {...register("password", { required: "Password is required" })}
                // Connect error state from react-hook-form
                error={!!errors.password}
                helperText={errors.password?.message}
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
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Grid>
          </Grid>
        </form>
        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}> {/* Add some margin */}
          <Grid item xs={12}>
            <Divider>Or</Divider> {/* Optional Divider */}
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined" // Use outlined style for secondary action
              color="primary"    // Or "inherit" if you prefer default text color
              fullWidth
              startIcon={<GoogleIcon />} // Add Google icon
              onClick={handleGoogleSignIn} // Call the Google Sign-in handler
              disabled={loading} // Disable while other auth is loading
            >
              Sign in with Google
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Snackbar for displaying Redux errors */}
      <Snackbar
        open={showError}
        autoHideDuration={18000}
        onClose={handleCloseSnackbar} // Use handler to close
        message={error || 'An error occurred'} // Display error from Redux state
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position Snackbar
      />
    </>
  );
};

export default LoginForm;
import React, { useState } from 'react';
import { Typography, Container, Paper, Alert, Button, Box, Snackbar } from '@mui/material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../redux/store';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [resendLoading, setResendLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setSnackbarMessage("Error: Not logged in.");
      setShowSnackbar(true);
      return;
    }
    setResendLoading(true);
    setSnackbarMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSnackbarMessage("Verification email sent successfully!");
      setShowSnackbar(true);
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      setSnackbarMessage(`Error: ${error.message}`);
      setShowSnackbar(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);
  const isVerified = user?.emailVerified === true;

  return (
    <Container maxWidth="lg">
      {!isVerified && user && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2, mb: 2 }} 
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend Email'}
            </Button>
          }
        >
          Your email address is not verified. Please check your inbox for a verification link.
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.displayName || 'User'}!
        </Typography>
        <Typography variant="body1" paragraph>
          This is your Thought Current dashboard.
          {user && (
            <Typography variant="caption" display="block">
              Email Verified: {isVerified ? 'Yes' : 'No'}
            </Typography>
          )}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            component={Link}
            to="/content/create"
            variant="contained"
            color="primary"
          >
            Create New Article
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
    </Container>
  );
};

export default Dashboard;
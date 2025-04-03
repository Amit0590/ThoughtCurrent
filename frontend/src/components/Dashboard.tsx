import React from 'react';
import { Typography, Container, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Welcome, {user?.displayName || 'User'}!</Typography>
        <Typography variant="body1">This is your Thought Current dashboard.</Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
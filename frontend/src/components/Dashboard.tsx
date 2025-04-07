import React from 'react';
import { Typography, Container, Paper, Button, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../redux/store';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.displayName || 'User'}!
        </Typography>
        <Typography variant="body1" paragraph>
          This is your Thought Current dashboard.
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
    </Container>
  );
};

export default Dashboard;
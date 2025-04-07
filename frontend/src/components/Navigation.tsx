import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../redux/slices/authSlice'; // Import logoutAsync
import { RootState, AppDispatch } from '../redux/store'; // Import AppDispatch

const Navigation: React.FC = () => {
  const dispatch: AppDispatch = useDispatch(); // Use AppDispatch type for dispatch
  const navigate = useNavigate(); // Initialize useNavigate
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutAsync()); // Dispatch logoutAsync to handle Firebase sign-out
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Button 
            component={Link} 
            to={isAuthenticated ? "/dashboard" : "/"} 
            color="inherit"
          >
            Thought Current
          </Button>
        </Box>
        {isAuthenticated ? (
          <>
            <Button 
              component={Link} 
              to="/content/create" 
              color="inherit"
              sx={{ mr: 2 }}
            >
              New Article
            </Button>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button component={Link} to="/login" color="inherit">Login</Button>
            <Button component={Link} to="/register" color="inherit">Sign Up</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
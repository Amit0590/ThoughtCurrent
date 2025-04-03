import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { RootState } from '../redux/store';

const Navigation: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Button component={Link} to="/" color="inherit">Thought Current</Button>
        </Box>
        {isAuthenticated ? (
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
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
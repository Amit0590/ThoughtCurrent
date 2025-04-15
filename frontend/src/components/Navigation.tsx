import React from 'react';
import { AppBar, Toolbar, Button, Box, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../redux/slices/authSlice';
import { RootState, AppDispatch } from '../redux/store';
// Theme imports
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../context/ThemeContext';

const Navigation: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { mode, toggleTheme } = useThemeContext();

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Brand/Home Links */}
        <Button
          component={Link}
          to="/"
          color="inherit"
          sx={{ fontSize: '1.25rem', textTransform: 'none' }}
        >
          Thought Current
        </Button>
        
        <Box sx={{ flexGrow: 1 }}>
          <Button 
            component={Link} 
            to="/" 
            color="inherit" 
            sx={{ ml: 2 }}
          >
            Home
          </Button>
        </Box>

        {/* Theme Toggle Button */}
        <IconButton 
          sx={{ ml: 1 }} 
          onClick={toggleTheme} 
          color="inherit" 
          aria-label="toggle theme mode"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {/* Login/Logout Buttons */}
        {isAuthenticated ? (
          <>
            <Button 
              component={Link} 
              to="/articles" 
              color="inherit" 
              sx={{ mr: 1 }}
            >
              My Articles
            </Button>
            <Button 
              component={Link} 
              to="/content/create" // Ensure this is the correct path
              color="inherit" 
              sx={{ mr: 1 }}
            >
              Create Article
            </Button>
            <Button 
              component={Link} 
              to="/dashboard" 
              color="inherit" 
              sx={{ mr: 1 }}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button 
              component={Link} 
              to="/login" 
              color="inherit"
            >
              Login
            </Button>
            <Button 
              component={Link} 
              to="/register" 
              color="inherit"
            >
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Dashboard from './components/Dashboard'; // Update the path to match the correct file structure
import { RootState, AppDispatch } from './redux/store';
import { handleRedirectResult, auth } from './firebase'; // Import handleRedirectResult and auth
import { loginSuccess } from './redux/slices/authSlice'; // Import loginSuccess

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const processRedirectResult = async () => {
      console.log("Checking for redirect sign-in result..."); // Log

      const redirectResult = await handleRedirectResult(); // Call handleRedirectResult

      if (redirectResult && redirectResult.user) {
        // Google Sign-in via redirect was successful!
        console.log("Google Sign-in Redirect Result:", redirectResult.user);
        dispatch(loginSuccess({
          id: redirectResult.user.uid,
          email: redirectResult.user.email || '',
          displayName: redirectResult.user.displayName || 'User',
        })); // Dispatch loginSuccess
      } else if (redirectResult && redirectResult.error) {
        // Handle redirect errors (optional - for more robust error handling)
        console.error("Google Sign-in Redirect Error:", redirectResult.error);
      } else {
        // No redirect result, check if user is already signed in (persistent session)
        console.log("No redirect result, checking for existing session...");
        const existingUser = auth.currentUser; // Use auth.currentUser for session check
        if (existingUser) {
          console.log("Existing user session found:", existingUser);
          dispatch(loginSuccess({
            id: existingUser.uid,
            email: existingUser.email || '',
            displayName: existingUser.displayName || 'User',
          }));
        } else {
          console.log("No existing session found."); // Log if no session
        }
      }
    };

    processRedirectResult(); // Call the function when component mounts
  }, [dispatch]); // Dependency array: only run on mount, dispatch is stable

  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
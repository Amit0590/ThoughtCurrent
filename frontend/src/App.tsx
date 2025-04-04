import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Dashboard from './components/Dashboard';
import { RootState, AppDispatch } from './redux/store';
import { handleRedirectResult, auth } from './firebase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const processRedirectResult = async () => {
            console.log("[App.tsx - useEffect] Checking for redirect sign-in result...");

            const redirectResult = await handleRedirectResult();

            if (redirectResult && redirectResult.user) {
                console.log("[App.tsx - useEffect] Google Sign-in Redirect Result: ", redirectResult.user);
                dispatch({ type: 'auth/login', payload: redirectResult.user });
            } else {
                console.log("[App.tsx - useEffect] No redirect result, checking for existing session...");
                if (auth.currentUser) {
                    console.log("[App.tsx - useEffect] Existing user session found:", auth.currentUser);
                    dispatch({ type: 'auth/login', payload: auth.currentUser });
                } else {
                    console.log("[App.tsx - useEffect] No existing session found.");
                }
            }
        };

        processRedirectResult();
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Navigation />
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegistrationForm />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
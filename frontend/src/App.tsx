import React, { useEffect } from 'react'; // Import useState
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Dashboard from './components/Dashboard';
import { RootState, AppDispatch } from './redux/store';
import { handleRedirectResult, auth } from './firebase';
import { loginSuccess } from './redux/slices/authSlice'; // Import loginSuccess

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    console.log("[ProtectedRoute] Rendering. isAuthenticated:", isAuthenticated); // <-- ADD THIS LOG

    if (!isAuthenticated) {
        console.log("[ProtectedRoute] isAuthenticated is false. Redirecting to /login."); // <-- ADD THIS LOG
        return <Navigate to="/login" />;
    }

    console.log("[ProtectedRoute] isAuthenticated is true. Rendering children."); // <-- ADD THIS LOG
    return <>{children}</>;
};

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        const processRedirectResult = async () => {
            console.log("[App.tsx - useEffect] Checking for redirect sign-in result...");

            const redirectResult = await handleRedirectResult();

            if (redirectResult && redirectResult.user) {
                const user = redirectResult.user;
                console.log("[App.tsx - useEffect] Google Sign-in Redirect Success. User:", user);

                dispatch(loginSuccess({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                }));
                console.log("[App.tsx - useEffect] loginSuccess dispatched.");
                setTimeout(() => {
                    console.log("[App.tsx - useEffect] Navigating to dashboard...");
                    navigate('/dashboard');
                }, 100);

            } else if (redirectResult && redirectResult.error) {
                console.error("[App.tsx - useEffect] Google Sign-in Redirect Error:", redirectResult.error);
            } else {
                console.log("[App.tsx - useEffect] No redirect result, checking for existing session...");
                if (auth.currentUser) {
                    const existingUser = auth.currentUser;
                    console.log("[App.tsx - useEffect] Existing user session found:", existingUser);
                    dispatch(loginSuccess({
                        uid: existingUser.uid,
                        email: existingUser.email,
                        displayName: existingUser.displayName,
                    }));
                    console.log("[App.tsx - useEffect] loginSuccess (existing session) dispatched.");
                    setTimeout(() => {
                        console.log("[App.tsx - useEffect] Navigating to dashboard (existing session)...");
                        navigate('/dashboard');
                    }, 100);
                } else {
                    console.log("[App.tsx - useEffect] No existing session found.");
                }
            }
        };

        processRedirectResult();
    }, [dispatch, navigate]); // Keep navigate in dependency array

    return (
        <>
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
        </>
    );
};

export default App;
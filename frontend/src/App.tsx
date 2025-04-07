import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Dashboard from './components/Dashboard';
import ContentEditor from './components/ContentEditor';
import ArticleView from './components/ArticleView';
import { RootState, AppDispatch } from './redux/store';
import { handleRedirectResult, auth } from './firebase';
import { loginSuccess } from './redux/slices/authSlice'; // Import loginSuccess

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = auth.currentUser;
            setAuthChecked(true);
            if (!currentUser) {
                console.log("[ProtectedRoute] No current user found");
            }
        };
        checkAuth();
    }, []);

    if (!authChecked) {
        return <div>Checking authentication...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const RedirectIfAuthenticated: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            await auth.onAuthStateChanged(() => {
                setAuthChecked(true);
            });
        };
        checkAuth();
    }, []);

    if (!authChecked) {
        return <div>Checking authentication...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    const [authChecked, setAuthChecked] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        const processAuth = async () => {
            console.log("Checking auth state...");
            
            // Listen for auth state changes
            const unsubscribe = auth.onAuthStateChanged((user) => {
                console.log("Auth state changed:", user ? "logged in" : "logged out");
                if (user) {
                    dispatch(loginSuccess({
                        uid: user.uid,
                        email: user.email || "",
                        displayName: user.displayName || undefined,
                    }));
                }
                setAuthChecked(true);
            });

            return () => unsubscribe();
        };

        processAuth();

        const processRedirectResult = async () => {
            const redirectResult = await handleRedirectResult();

            if (redirectResult && redirectResult.user) {
                const user = redirectResult.user;
                dispatch(loginSuccess({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                }));
                // Only navigate on fresh Google sign-in
                if (redirectResult.credential) {
                    navigate('/dashboard');
                }
            }
        };

        processRedirectResult();
    }, [dispatch, navigate]);

    if (!authChecked) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Navigation />
            <Routes>
                <Route path="/login" element={
                    <RedirectIfAuthenticated>
                        <LoginForm />
                    </RedirectIfAuthenticated>
                } />
                <Route path="/register" element={
                    <RedirectIfAuthenticated>
                        <RegistrationForm />
                    </RedirectIfAuthenticated>
                } />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/content/create"
                    element={
                        <ProtectedRoute>
                            <ContentEditor />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/article/:articleId/edit"
                    element={
                        <ProtectedRoute>
                            <ContentEditor />
                        </ProtectedRoute>
                    }
                />
                <Route path="/article/:articleId" element={<ArticleView />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </>
    );
};

export default App;
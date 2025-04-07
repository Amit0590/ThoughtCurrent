import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import Dashboard from './components/Dashboard';
import ContentEditor from './components/ContentEditor';
import ArticleView from './components/ArticleView';
import ArticleList from './components/ArticleList';
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
            console.log("[App] Starting auth state monitoring...");
            
            const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
                console.log("[App] Auth state changed:", firebaseUser ? "logged in" : "logged out");
                if (firebaseUser) {
                    // Create serializable user object
                    const serializableUser = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || null,
                        displayName: firebaseUser.displayName || null,
                    };
                    dispatch(loginSuccess(serializableUser));
                }
                setAuthChecked(true);
            });

            return () => unsubscribe();
        };

        const processRedirectResult = async () => {
            const redirectResult = await handleRedirectResult();

            if (redirectResult && redirectResult.user) {
                // Create serializable user object
                const serializableUser = {
                    id: redirectResult.user.uid,
                    email: redirectResult.user.email || null,
                    displayName: redirectResult.user.displayName || null,
                };
                dispatch(loginSuccess(serializableUser));
                
                if (redirectResult.credential) {
                    navigate('/dashboard');
                }
            }
        };

        processAuth();
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
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
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
                <Route
                    path="/articles"
                    element={
                        <ProtectedRoute>
                            <ArticleList />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </>
    );
};

export default App;
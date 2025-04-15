import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './components/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';// Double check this import path
import Dashboard from './components/Dashboard';
import ContentEditor from './components/ContentEditor';
import ArticleView from './components/ArticleView';
import ArticleList from './components/ArticleList';
import ActionHandler from './components/auth/ActionHandler';
import PublicArticleList from './components/PublicArticleList';
import HomePage from './components/HomePage'; // Import the new HomePage component
import FilteredArticleList from './components/FilteredArticleList'; // Import the new component
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
                        emailVerified: firebaseUser.emailVerified,
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
                const user = redirectResult.user;
                // Create serializable user object
                const serializableUser = {
                    id: user.uid,
                    email: user.email || null,
                    displayName: user.displayName || null,
                    emailVerified: user.emailVerified,
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
                <Route path="/" element={<HomePage />} />
                
                {/* Add new filter routes */}
                <Route path="/category/:name" element={<FilteredArticleList filterType="category" />} />
                <Route path="/tag/:name" element={<FilteredArticleList filterType="tag" />} />
                
                {/* ...other existing routes... */}
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
                <Route path="/auth/action" element={<ActionHandler />} />
                <Route path="/essays" element={<PublicArticleList />} /> {/* Keep the essays route */}
            </Routes>
        </>
    );
};

export default App;
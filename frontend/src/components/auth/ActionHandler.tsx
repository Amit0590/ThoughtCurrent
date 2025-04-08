import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../firebase';
import { Container, Paper, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';

const ActionHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        let isMounted = true;

        const handleAction = async () => {
            setLoading(true);
            setError(null);
            setMessage(null);

            if (!mode || !oobCode) {
                setError("Invalid action link: Missing required parameters.");
                setLoading(false);
                return;
            }

            let actionSuccess = false;

            try {
                switch (mode) {
                    case 'verifyEmail':
                        console.log("[ActionHandler] Attempting verifyEmail:", oobCode);
                        await applyActionCode(auth, oobCode);
                        actionSuccess = true;
                        console.log("[ActionHandler] applyActionCode resolved successfully.");
                        
                        try {
                            await auth.currentUser?.reload();
                            console.log("[ActionHandler] User state reloaded.");
                        } catch (reloadError) {
                            console.warn("[ActionHandler] User reload failed, state might be stale:", reloadError);
                        }

                        if (isMounted) {
                            setMessage("Your email has been verified successfully! You should be able to log in now or refresh the page.");
                        }
                        break;

                    case 'resetPassword':
                        console.log("[ActionHandler] Verifying resetPassword code:", oobCode);
                        await verifyPasswordResetCode(auth, oobCode);
                        actionSuccess = true;
                        console.log("[ActionHandler] Reset code verified. Navigating...");
                        navigate(`/reset-password?oobCode=${oobCode}`);
                        return;

                    default:
                        setError("Invalid action link: Unknown mode.");
                }
            } catch (error: any) {
                console.error(`[ActionHandler] Error during action (${mode}):`, error);
                if (isMounted && !actionSuccess) {
                    let errorMessage = "An error occurred. Please try again.";
                    if (error.code === 'auth/expired-action-code') {
                        errorMessage = "This link has expired. Please request a new one.";
                    } else if (error.code === 'auth/invalid-action-code') {
                        errorMessage = "This link is invalid or has already been used.";
                    }
                    setError(errorMessage);
                } else if (isMounted && actionSuccess && mode === 'verifyEmail') {
                    setMessage("Email verification processed, but state refresh might be delayed. Please try logging in or refreshing.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        handleAction();
        return () => { isMounted = false };
    }, [mode, oobCode, navigate]);

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 5, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                    Processing Action...
                </Typography>
                {loading && <CircularProgress sx={{ mt: 2, mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                <Box sx={{ mt: 3 }}>
                    <Button component={Link} to="/login" variant="contained">
                        Go to Login
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ActionHandler;

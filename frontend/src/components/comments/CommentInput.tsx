import React, { useState } from 'react';
import { TextField, Button, Box, CircularProgress, Snackbar } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store'; // Adjust path if needed
import { auth } from '../../firebase'; // Adjust path if needed

interface CommentInputProps {
    articleId: string;
    parentCommentId?: string | null; // Optional for replies
    onCommentPosted: (newComment: any) => void; // Callback to update comment list
}

interface CommentFormInputs {
    text: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ articleId, parentCommentId = null, onCommentPosted }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormInputs>();
    const [loading, setLoading] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const onSubmit: SubmitHandler<CommentFormInputs> = async (data) => {
        if (!isAuthenticated || !user) {
            setSnackbarMessage("Please log in to post a comment.");
            setShowSnackbar(true);
            return;
        }
        if (!data.text || data.text.trim().length === 0) {
            // React Hook Form should catch this, but double check
            setSnackbarMessage("Comment cannot be empty.");
            setShowSnackbar(true);
            return;
        }

        setLoading(true);
        setSnackbarMessage('');

        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) throw new Error("Authentication required.");

            const requestBody = {
                articleId: articleId,
                text: data.text,
                parentCommentId: parentCommentId, // Pass parent ID if it exists
                // authorName and userPhotoUrl will be set by backend from token
            };

            const functionUrl = "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/postComment";

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                console.log("Comment posted successfully:", responseData.comment);
                onCommentPosted(responseData.comment); // Pass new comment up to parent
                reset({ text: '' }); // Clear the form
                // Optional: Show success snackbar
                // setSnackbarMessage("Comment posted!");
                // setShowSnackbar(true);
            } else {
                throw new Error(responseData.error || "Failed to post comment.");
            }

        } catch (error: any) {
            console.error("Error posting comment:", error);
            setSnackbarMessage(`Error: ${error.message}`);
            setShowSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => setShowSnackbar(false);

    // Optionally hide input if user is not logged in
    // if (!isAuthenticated) {
    //     return <Typography variant="caption">Please log in to comment.</Typography>;
    // }

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2, mb: 2 }}>
            <TextField
                label="Add a comment..."
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                {...register("text", { required: "Comment cannot be empty" })}
                error={!!errors.text}
                helperText={errors.text?.message}
                disabled={loading || !isAuthenticated} // Disable if loading or not logged in
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button type="submit" variant="contained" disabled={loading || !isAuthenticated}>
                    {loading ? <CircularProgress size={20} /> : "Post Comment"}
                </Button>
            </Box>
             <Snackbar
                open={showSnackbar}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
};

export default CommentInput;

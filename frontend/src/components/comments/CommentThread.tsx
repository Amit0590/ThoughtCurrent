import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, List } from '@mui/material';
import CommentItem from './CommentItem'; // Import CommentItem

// Define Comment interface (can share)
interface Comment {
    id: string;
    articleId: string;
    userId: string;
    userName: string;
    userPhotoUrl?: string | null;
    text: string;
    parentCommentId?: string | null;
    createdAt: string | any;
}

interface CommentThreadProps {
    articleId: string;
    newComment?: Comment | null; // Prop to receive newly posted comments
}

const CommentThread: React.FC<CommentThreadProps> = ({ articleId, newComment }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch comments when component mounts or articleId changes
    useEffect(() => {
        const fetchComments = async () => {
            if (!articleId) return; // Don't fetch without articleId

            setLoading(true);
            setError(null);
            console.log(`[CommentThread] Fetching comments for article: ${articleId}`);

            try {
                const functionUrl = `https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/getComments?articleId=${articleId}`;

                const response = await fetch(functionUrl, { method: 'GET' });
                const responseData = await response.json();

                if (response.ok) {
                    console.log(`[CommentThread] Received ${responseData.length} comments.`);
                    setComments(responseData as Comment[]);
                } else {
                    throw new Error(responseData.error || 'Failed to fetch comments');
                }
            } catch (err: any) {
                console.error("[CommentThread] Error fetching comments:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [articleId]); // Dependency array ensures fetch on articleId change

     // Effect to add newly posted comments received via props
     useEffect(() => {
        if (newComment) {
             console.log("[CommentThread] Adding new comment from prop:", newComment);
             // Add to the beginning of the list for immediate feedback
             setComments(prevComments => [newComment, ...prevComments]);
        }
     }, [newComment]); // Run when newComment prop changes


    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Comments ({comments.length})</Typography>
            {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Be the first to comment!
                </Typography>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1 }}>
                    {comments.map((comment) => (
                        // Render CommentItem for each top-level comment
                        <CommentItem key={comment.id} comment={comment} />
                        // We will add replies later inside CommentItem or here
                    ))}
                </List>
            )}
        </Box>
    );
};

export default CommentThread;

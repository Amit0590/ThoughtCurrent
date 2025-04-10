import React from 'react';
import { Avatar, Box, Typography, Paper } from '@mui/material';

// Define Comment interface (can share with backend/other components later)
interface Comment {
    id: string;
    articleId: string;
    userId: string;
    userName: string;
    userPhotoUrl?: string | null;
    text: string;
    parentCommentId?: string | null;
    createdAt: string | any; // Expecting ISO string or Date
    // ... other fields if needed
}

interface CommentItemProps {
    comment: Comment;
    // Add props for reply functionality later
}

// Helper function to format dates (reuse or define here)
const formatCommentDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Just now';
    try {
        const date = new Date(dateString);
        // Add more sophisticated relative time later if desired
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
        return 'Invalid Date';
    }
};


const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
    return (
        <Paper elevation={0} sx={{ display: 'flex', p: 2, mb: 2, border: '1px solid #444', borderRadius: 1 }}>
            <Avatar
                alt={comment.userName}
                src={comment.userPhotoUrl || undefined} // Use photoURL or default
                sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" component="span" fontWeight="bold">
                        {comment.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {formatCommentDate(comment.createdAt)}
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}> {/* Allow line breaks */}
                    {comment.text}
                </Typography>
                 {/* Add Reply button/actions later */}
            </Box>
        </Paper>
    );
};

export default CommentItem;

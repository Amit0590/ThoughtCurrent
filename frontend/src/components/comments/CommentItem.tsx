import React, { useState, useEffect, useCallback } from 'react';
import { 
  Avatar, 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Collapse, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import CommentInput from './CommentInput';
import { FUNCTION_URLS } from '../../redux/api/articlesApi'; // Import the function URLs

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
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replies, setReplies] = useState<Comment[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);
    const [repliesFetched, setRepliesFetched] = useState(false); // Add state to track if fetch was attempted
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        console.log('[CommentItem] Component rendered, props.comment:', comment);
    }, [comment]);

    // Use useCallback to memoize the fetchReplies function
    const fetchReplies = useCallback(async () => {
        if (!showReplies || replies.length > 0) return;

        setLoadingReplies(true);
        setReplyError(null);
        console.log(`[CommentItem] Fetching replies for comment.id: ${comment.id}`);
        
        try {
            const functionUrl = `${FUNCTION_URLS.getReplies}?parentId=${comment.id}`;
            console.log(`[CommentItem] Using getReplies URL: ${functionUrl}`);
            
            const response = await fetch(functionUrl);
            console.log(`[CommentItem] Response status:`, response.status);
            
            const data = await response.json();
            console.log(`[CommentItem] Response data:`, data);
            
            if (response.ok) {
                console.log(`[CommentItem] Setting ${data.length} replies to state`);
                setReplies(data);
            } else {
                const errorMsg = data.error || 'Failed to fetch replies';
                console.error(`[CommentItem] Error in response:`, errorMsg);
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error("[CommentItem] Error fetching replies:", err);
            setReplyError(err.message);
        } finally {
            setLoadingReplies(false);
            setRepliesFetched(true); // Set fetched flag to true whether successful or not
            console.log(`[CommentItem fetchReplies] FINALLY block for ${comment.id}, repliesFetched set to true`);
        }
    }, [comment.id, showReplies, replies.length]); // Dependencies

    // Modified useEffect to check repliesFetched flag
    useEffect(() => {
        if (showReplies && !repliesFetched && !loadingReplies) {
            console.log(`[CommentItem useEffect] Fetching initial replies for ${comment.id}...`);
            fetchReplies();
        }
    }, [showReplies, repliesFetched, loadingReplies, fetchReplies, comment.id]); // Added comment.id to dependencies

    const handleReplyPosted = (newReply: Comment) => {
        console.log("New reply posted, adding to state:", newReply);
        setReplies(prevReplies => [newReply, ...prevReplies]);
        setShowReplyInput(false);
        setShowReplies(true);
    };

    return (
        <Paper elevation={0} sx={{ display: 'flex', p: 2, mb: 2, border: '1px solid #444', borderRadius: 1 }}>
            <Avatar
                alt={comment.userName}
                src={comment.userPhotoUrl || undefined}
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
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.text}
                </Typography>
                
                {/* Reply controls */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {isAuthenticated && (
                        <Button size="small" onClick={() => setShowReplyInput(!showReplyInput)}>
                            {showReplyInput ? 'Cancel' : 'Reply'}
                        </Button>
                    )}
                    <Button 
                        size="small" 
                        onClick={() => { 
                            console.log(`[CommentItem] Show Replies clicked, current state: showReplies=${showReplies}`);
                            setShowReplies(!showReplies);
                            // If we're newly showing OR there was a previous error, allow refetch
                            if (!showReplies || replyError) {
                                // Reset fetch flag if there was an error, allowing a retry
                                if (replyError) setRepliesFetched(false);
                                console.log(`[CommentItem] Will fetch replies now`);
                                // The useEffect will handle the fetch based on the updated state
                            }
                        }} 
                        disabled={loadingReplies}
                    >
                        {loadingReplies ? 'Loading...' : (showReplies ? 'Hide Replies' : 'Show Replies')}
                    </Button>
                </Box>

                {/* Collapsible Reply Input */}
                <Collapse in={showReplyInput} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 5, mt: 1 }}>
                        <CommentInput
                            articleId={comment.articleId}
                            parentCommentId={comment.id}
                            onCommentPosted={handleReplyPosted}
                        />
                    </Box>
                </Collapse>

                {/* Collapsible Replies Display */}
                <Collapse in={showReplies} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 5, mt: 2, borderLeft: '2px solid #555', pt: 1 }}>
                        {loadingReplies && <CircularProgress size={20} />}
                        {replyError && <Alert severity="error">{replyError}</Alert>}
                        {!loadingReplies && !replyError && replies.length === 0 && (
                            <Typography variant="caption" color="text.secondary">No replies yet.</Typography>
                        )}
                        {!loadingReplies && !replyError && replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} />
                        ))}
                    </Box>
                </Collapse>
            </Box>
        </Paper>
    );
};

export default CommentItem;

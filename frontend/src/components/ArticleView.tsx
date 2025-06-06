import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton, Chip } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { auth } from '../firebase';
import CommentInput from './comments/CommentInput'; // Import CommentInput component
import CommentThread from './comments/CommentThread'; // Add import for CommentThread
import { FUNCTION_URLS } from '../redux/api/articlesApi'; // Import the function URLs

// Add empty export to make this file a module
export {};

export interface Article {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  status: 'draft' | 'published';
  createdAt: { _seconds: number, _nanoseconds: number } | any;
  updatedAt: { _seconds: number, _nanoseconds: number } | any;
  categories?: string[];
  tags?: string[];
}

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  }
  try {
    return timestamp.toDate().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return 'Invalid Date';
  }
};

// Add article content styles
const articleContentStyles = {
  '& h1': { fontSize: '2.5rem', mb: 3, mt: 4 },
  '& h2': { fontSize: '2rem', mb: 2.5, mt: 3.5 },
  '& h3': { fontSize: '1.75rem', mb: 2, mt: 3 },
  '& p': { mb: 2, lineHeight: 1.7 },
  '& blockquote': {
    borderLeft: '4px solid',
    borderColor: 'primary.main',
    pl: 2,
    py: 1,
    my: 2,
    fontStyle: 'italic',
  },
  '& ul, & ol': { 
    pl: 4, 
    mb: 2,
    '& li': {
      mb: 1,
    }
  },
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 1,
    my: 2
  },
  '& pre': {
    backgroundColor: 'grey.900',
    p: 2,
    borderRadius: 1,
    overflow: 'auto',
    mb: 2
  },
  '& code': {
    fontFamily: 'monospace',
    backgroundColor: 'grey.900',
    p: 0.5,
    borderRadius: 0.5
  }
};

const ArticleView: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);  // Fix: access user through auth slice
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [comments, setComments] = useState<any[]>([]); // State to hold comments

  const handleClickOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);

  const handleDeleteConfirm = async () => {
    if (!article || !currentUser || currentUser.id !== article.authorId) {
      console.error("Delete authorization failed or article missing.");
      setDeleteError("Authorization failed.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Authentication token not found.");

      const functionUrl = `${FUNCTION_URLS.deleteArticle}?id=${article.id}`;

      const response = await fetch(functionUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        console.log(`Article ${article.id} deleted successfully.`);
        handleCloseDeleteDialog();
        navigate('/articles');
      } else {
        throw new Error(responseData.error || `Failed to delete article (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error("Error deleting article:", error);
      setDeleteError(`Deletion failed: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError("Article ID not found in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log(`[ArticleView] Fetching article with ID: ${articleId}`);

      try {
        const token = await auth.currentUser?.getIdToken();
        const functionUrl = `${FUNCTION_URLS.getArticle}?id=${articleId}`;

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: headers,
        });

        console.log("[ArticleView] API Response Status:", response.status);
        const responseData = await response.json();

        if (response.ok) {
          console.log("[ArticleView] Raw responseData BEFORE setArticle:", 
            JSON.stringify(responseData, null, 2));
          console.log("[ArticleView] Checking authorId exists:", 
            Boolean(responseData.authorId));
          console.log("[ArticleView] authorId value:", responseData.authorId);

          setArticle(responseData as Article);
        } else {
          console.error("[ArticleView] API Error Response:", responseData);
          throw new Error(responseData.error || `Article not found or access denied (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.error("[ArticleView] Error fetching article:", error);
        setError(`Error loading article: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    if (article) {
      console.log("[ArticleView - State Monitor] Article state updated:", 
        JSON.stringify(article, null, 2));
      console.log("[ArticleView - State Monitor] Comparing IDs after state update:", 
        currentUser?.id, article.authorId);
      const isAuthorCheck = currentUser?.id === article.authorId;
      console.log("[ArticleView - State Monitor] isAuthor after state update:", isAuthorCheck);
    }
  }, [article, currentUser?.id]);

  const handleCommentPosted = (newComment: any) => {
    console.log("New comment received in ArticleView:", newComment);
    // Add the new comment to the beginning of the comments state array
    // For nested comments, more complex logic is needed here or in fetching
    setComments(prevComments => [newComment, ...prevComments]);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={40} width="60%" />
            <Skeleton variant="text" width="30%" />
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={200} />
              <Box sx={{ mt: 2 }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="text" sx={{ my: 1 }} />
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>Article data could not be loaded.</Alert>
      </Container>
    );
  }

  // Add debug logging
  console.log("[ArticleView] Current User from Redux:", currentUser);
  console.log("[ArticleView] Article Data from State:", article);
  console.log("[ArticleView] Comparing currentUser?.id:", currentUser?.id, 
              "with article.authorId:", article.authorId);
  
  const isAuthor = currentUser?.id === article.authorId;
  console.log("[ArticleView] isAuthor evaluated as:", isAuthor);

  return (
    <Container maxWidth="md">
      <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, mt: 4, mb: 4 }}>
        {isAuthor && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button
              component={RouterLink}
              to={`/article/${article?.id}/edit`}
              variant="outlined"
              size="small"
            >
              Edit Article
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClickOpenDeleteDialog}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </Box>
        )}

        <Typography variant="h3" component="h1" gutterBottom>
          {article?.title}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap' 
        }}>
          <span>By {article?.authorName}</span>
          <span>
            {article?.updatedAt && `Updated: ${formatTimestamp(article.updatedAt)}`}
            {article?.updatedAt && article?.createdAt && ' / '}
            {article?.createdAt && `Created: ${formatTimestamp(article.createdAt)}`}
          </span>
        </Typography>

        {isAuthor && article?.status === 'draft' && (
          <Typography variant="caption" color="warning.main" display="block" gutterBottom>
            Status: Draft (Only visible to you)
          </Typography>
        )}

        <Box
          className="article-content"
          sx={{
            mt: 3,
            color: 'text.primary',
            ...articleContentStyles
          }}
          dangerouslySetInnerHTML={{ __html: article?.content || '' }}
        />

        {/* Enhanced Categories and Tags section */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(128, 128, 128, 0.2)' }}>
          {/* Categories */}
          {article?.categories && article.categories.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ display: 'inline-block', mr: 1 }}>Categories:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {article.categories.map((category, index) => (
                  <Chip
                    key={`cat-${index}`}
                    label={category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    component={RouterLink}
                    to={`/category/${encodeURIComponent(category)}`}
                    clickable
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Tags */}
          {article?.tags && article.tags.length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ display: 'inline-block', mr: 1 }}>Tags:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {article.tags.map((tag, index) => (
                  <Chip
                    key={`tag-${index}`}
                    label={tag}
                    size="small"
                    color="default"
                    variant="outlined"
                    component={RouterLink}
                    to={`/tag/${encodeURIComponent(tag)}`}
                    clickable
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* --- ADD Comment Input --- */}
      {/* Only show if article loaded successfully */}
      {article && (
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mt: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Post a Comment</Typography>
          <CommentInput
            articleId={article.id}
            onCommentPosted={handleCommentPosted}
          />
          {/* We will add comment display logic later */}
          <Box sx={{mt: 3}}>
            {/* Remove the <pre> block */}
            {/* <pre>{JSON.stringify(comments, null, 2)}</pre> */}

            {/* --- ADD Comment Thread Component --- */}
            <CommentThread 
              articleId={article.id} 
              newComment={comments.length > 0 ? comments[0] : null} 
            />
            {/* --- END Comment Thread --- */}
          </Box>
        </Paper>
      )}
      {/* --- End Comment Input/Display Section --- */}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete this article? This action cannot be undone.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArticleView;

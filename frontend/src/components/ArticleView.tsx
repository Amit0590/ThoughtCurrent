import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { auth } from '../firebase';

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

      const functionUrl = `https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/deleteArticle?id=${article.id}`;

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
        const functionUrl = `https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/getArticle?id=${articleId}`;

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

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
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
              component={Link}
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
            '& p': { mb: 2 }, 
            '& strong': { fontWeight: 'bold' }, 
            '& em': { fontStyle: 'italic' }, 
            '& ul': { pl: 4 }, 
            '& ol': { pl: 4 } 
          }}
          dangerouslySetInnerHTML={{ __html: article?.content || '' }}
        />

        {/* Categories and Tags sections */}
        {article?.categories && article.categories.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(128, 128, 128, 0.2)' }}>
            <Typography variant="overline">Categories:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {article.categories.map((cat, index) => (
                <span key={index} style={{ 
                  background: '#555', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem' 
                }}>
                  {cat}
                </span>
              ))}
            </Box>
          </Box>
        )}

        {article?.tags && article.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="overline">Tags:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {article.tags.map((tag, index) => (
                <span key={index} style={{ 
                  background: '#444', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem' 
                }}>
                  {tag}
                </span>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

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

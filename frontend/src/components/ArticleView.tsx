import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Alert, Box } from '@mui/material';
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
  createdAt: string;
  updatedAt: string;
  categories?: string[];
  tags?: string[];
}

const ArticleView: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError("Article ID not found in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

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

        const responseData = await response.json();

        if (response.ok) {
          setArticle(responseData as Article);
        } else {
          throw new Error(responseData.error || `Failed to fetch article (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.error("Error fetching article:", error);
        setError(`Error loading article: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

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

  return (
    <Container maxWidth="md">
      <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {article.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          By {article.authorName} • {article.status}
        </Typography>
        <Box
          sx={{ mt: 3, '& p': { mb: 2 }, '& strong': { fontWeight: 'bold' } }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </Paper>
    </Container>
  );
};

export default ArticleView;

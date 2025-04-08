import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Box, List, ListItem, Divider } from '@mui/material';

interface PublicArticle {
  id: string;
  title: string;
  authorName?: string;
  contentSnippet?: string;
  createdAt: string;
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const stripHtml = (html: string | undefined): string => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const PublicArticleList: React.FC = () => {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicArticles = async () => {
      setLoading(true);
      setError(null);
      console.log("[PublicArticleList] Fetching public articles...");

      try {
        const functionUrl = "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/listPublicArticles";
        console.log("[PublicArticleList] Using function URL:", functionUrl);

        const response = await fetch(functionUrl, { method: 'GET' });
        console.log("[PublicArticleList] Response status:", response.status);
        const responseData = await response.json();

        if (response.ok) {
          console.log(`[PublicArticleList] Received ${responseData.length} articles`);
          setArticles(responseData as PublicArticle[]);
        } else {
          console.error("[PublicArticleList] Error response:", responseData);
          throw new Error(responseData.error || `Failed to fetch articles (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.error("[PublicArticleList] Error:", error);
        setError(`Error loading articles: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicArticles();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Essays & Analysis
        </Typography>
        {articles.length === 0 ? (
          <Typography sx={{ mt: 2 }}>No published articles found yet.</Typography>
        ) : (
          <List>
            {articles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                  <Typography
                    component={Link}
                    to={`/article/${article.id}`}
                    variant="h6"
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      '&:hover': { textDecoration: 'underline' },
                      mb: 0.5 
                    }}
                  >
                    {article.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    By {article.authorName || 'Unknown Author'} 
                    on {formatDate(article.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {stripHtml(article.contentSnippet)}
                  </Typography>
                </ListItem>
                {index < articles.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default PublicArticleList;

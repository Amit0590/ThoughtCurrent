import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Alert,
  Box,
  List,
  ListItem,
  Divider,
  IconButton,
  Button,
  Skeleton,
} from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';
import { auth } from '../firebase';

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published';
  authorId: string;
  authorName?: string;
  content?: string;
  contentSnippet?: string;
  createdAt: string | any;
  updatedAt: string | any;
  categories?: string[];
  tags?: string[];
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      console.log("[ArticleList] Fetching user articles...");

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.log("[ArticleList] No auth token found. Cannot fetch user articles.");
          setArticles([]);
          setLoading(false);
          return;
        }

        const functionUrl = "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/listArticles";
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: headers
        });

        console.log("[ArticleList] API Response Status:", response.status);
        const responseData = await response.json();

        if (response.ok) {
          console.log(`[ArticleList] Received ${responseData.length} articles.`);
          setArticles(responseData as Article[]);
        } else {
          throw new Error(responseData.error || `Failed to fetch articles (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.error("[ArticleList] Error fetching articles:", error);
        setError(`Error loading articles: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    let isMounted = true;
    if (isMounted) {
      fetchArticles();
    }
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="rectangular" width={150} height={36} />
          </Box>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="80%" height={28} />
              <Skeleton variant="text" width="30%" height={24} />
            </Box>
          ))}
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  const EmptyState = () => (
    <Box sx={{ 
      textAlign: 'center', 
      py: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      <ArticleIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
      <Typography variant="h6" color="text.secondary">
        No Articles Yet
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Create your first article to get started
      </Typography>
      <Button
        component={Link}
        to="/content/create"
        variant="contained"
        sx={{ mt: 2 }}
      >
        Write an Article
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            My Articles
          </Typography>
          <Button component={Link} to="/content/create" variant="contained">
            Create New Article
          </Button>
        </Box>
        {articles.length === 0 ? <EmptyState /> : (
          <List>
            {articles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      component={Link}
                      to={`/article/${article.id}/edit`}
                    >
                      Edit
                    </IconButton>
                  }
                  sx={{ flexDirection: 'column', pr: 10 }}
                >
                  <Typography
                    component={Link}
                    to={`/article/${article.id}`}
                    variant="h6"
                    sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline' }, mb: 0.5 }}
                  >
                    {article.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Status: {article.status} | Updated: {formatDate(article.updatedAt)}
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

export default ArticleList;

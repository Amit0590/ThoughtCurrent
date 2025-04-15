import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Alert,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Skeleton,
  Chip,
} from '@mui/material';
import { Article as ArticleIcon, Edit as EditIcon } from '@mui/icons-material';
import { auth } from '../firebase';
import { FUNCTION_URLS } from '../redux/api/articlesApi'; // Import the function URLs

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published';
  authorId: string;
  authorName?: string;
  imageUrl?: string | null;
  shortDescription?: string;
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
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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

        const functionUrl = FUNCTION_URLS.listArticles;
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

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={150} height={36} />
        </Box>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={28} />
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Error state
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
        component={RouterLink}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Articles
          </Typography>
          <Button component={RouterLink} to="/content/create" variant="contained">
            Create New Article
          </Button>
        </Box>

        {articles.length === 0 ? <EmptyState /> : (
          <Grid container spacing={4}>
            {articles.map((article) => (
              <Grid item key={article.id} xs={12} sm={6} md={4}>
                <Card sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={article.imageUrl || `https://source.unsplash.com/random/400x200/?abstract&sig=${article.id}`}
                    alt={article.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={article.status === 'published' ? 'Published' : 'Draft'}
                        color={article.status === 'published' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last Updated: {formatDate(article.updatedAt)}
                      </Typography>
                    </Box>
                    <Typography 
                      gutterBottom 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontWeight: 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {article.title}
                    </Typography>
                    {article.shortDescription && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {article.shortDescription}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', mt: 'auto' }}>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/article/${article.id}`}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/article/${article.id}/edit`}
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ArticleList;

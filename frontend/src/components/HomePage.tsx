import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Skeleton,
  Paper,
  Button,
  useTheme
} from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { FUNCTION_URLS } from '../redux/api/articlesApi'; // Import the function URLs

// Enhanced Article interface with new fields
interface HomepageArticle {
  id: string;
  title: string;
  authorName: string;
  shortDescription?: string;
  contentSnippet?: string;
  imageUrl?: string | null;
  publishedAt: string | null;
  categories?: string[];
  tags?: string[];
}

// Format date in a more human-readable way
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return 'Invalid Date';
  }
};

const HomePage: React.FC = () => {
  const [articles, setArticles] = useState<HomepageArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchHomepageArticles = async () => {
      setLoading(true);
      setError(null);
      console.log("[HomePage] Fetching homepage articles...");

      try {
        const functionUrl = FUNCTION_URLS.getHomepageArticles;
        console.log("[HomePage] Using function URL:", functionUrl);

        const response = await fetch(functionUrl, { method: 'GET' });
        console.log("[HomePage] Response status:", response.status);
        const responseData = await response.json();

        if (response.ok) {
          console.log(`[HomePage] Received ${responseData.length} articles`);
          setArticles(responseData as HomepageArticle[]);
        } else {
          console.error("[HomePage] Error response:", responseData);
          throw new Error(responseData.error || `Failed to fetch articles (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.error("[HomePage] Error:", error);
        setError(`Error loading articles: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageArticles();
  }, []);

  // Loading Skeletons for a better UX during loading
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Skeleton variant="text" width="50%" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="70%" height={30} sx={{ mb: 4 }} />
          
          <Grid container spacing={4}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={180} />
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  // Error display
  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">Error Loading Articles</Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={1} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Welcome to Thought Current</Typography>
          <Typography variant="body1" paragraph>
            Our platform for scholarly discourse and knowledge sharing is just getting started.
          </Typography>
          <Typography variant="body1" paragraph>
            Check back soon for fresh insights and analysis.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Featured article is the first one
  const featuredArticle = articles[0];
  // Rest of the articles
  const secondaryArticles = articles.slice(1);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography 
          component="h1" 
          variant="h3" 
          color="primary" 
          gutterBottom
          sx={{ 
            fontWeight: 500,
            fontFamily: '"Noto Serif", serif',
            mb: 1
          }}
        >
          Thought Current
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            mb: 4,
            maxWidth: '800px', 
            fontFamily: '"Noto Serif", serif',
            fontWeight: 400
          }}
        >
          Exploring ideas that shape our world through scholarly discourse and in-depth analysis
        </Typography>

        {/* Featured Article */}
        {featuredArticle && (
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              mb: 6,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <CardActionArea component={RouterLink} to={`/article/${featuredArticle.id}`}>
              <Grid container>
                <Grid item xs={12} md={7}>
                  <CardMedia
                    component="img"
                    height={400}
                    image={featuredArticle.imageUrl || "https://source.unsplash.com/random/1080x720/?abstract,concept"}
                    alt={featuredArticle.title}
                    sx={{ 
                      height: { xs: 200, sm: 300, md: '100%' },
                      objectFit: 'cover'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 1 }}>
                      {/* Enhanced Categories display */}
                      {featuredArticle.categories && featuredArticle.categories.slice(0, 2).map((category, index) => (
                        <Chip 
                          key={`cat-${index}`}
                          label={category} 
                          size="small" 
                          color="primary"
                          sx={{ mr: 1, mb: 1 }}
                          // Remove RouterLink and clickable props
                        />
                      ))}
                      <Typography variant="caption" display="flex" alignItems="center" color="text.secondary">
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {formatDate(featuredArticle.publishedAt)}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 500,
                        lineHeight: 1.2,
                        mb: 2,
                        fontFamily: '"Noto Serif", serif'
                      }}
                    >
                      {featuredArticle.title}
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {featuredArticle.shortDescription || featuredArticle.contentSnippet || 
                       "Read this featured article for insightful perspectives and analysis."}
                    </Typography>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="body2" color="text.secondary">
                        By {featuredArticle.authorName}
                      </Typography>
                      {/* Add Tags display */}
                      {featuredArticle.tags && featuredArticle.tags.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {featuredArticle.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={`tag-${index}`}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="default"
                              // Remove RouterLink and clickable props
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Grid>
              </Grid>
            </CardActionArea>
          </Paper>
        )}

        {/* Secondary Articles Grid */}
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontFamily: '"Noto Serif", serif',
            fontWeight: 500
          }}
        >
          Latest Articles
        </Typography>
        
        <Grid container spacing={4}>
          {secondaryArticles.map(article => (
            <Grid item xs={12} sm={6} md={4} key={article.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <CardActionArea 
                  component={RouterLink} 
                  to={`/article/${article.id}`}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardMedia
                    component="img"
                    height={140}
                    image={article.imageUrl || `https://source.unsplash.com/random/400x200/?abstract,concept&sig=${article.id}`}
                    alt={article.title}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 1 }}>
                      {/* Enhanced Categories display */}
                      {article.categories && article.categories.slice(0, 1).map((category, index) => (
                        <Chip 
                          key={`cat-${index}`}
                          label={category} 
                          size="small"
                          sx={{ 
                            mr: 1, 
                            mb: 1,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                          }}
                          // Remove RouterLink and clickable props
                        />
                      ))}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(article.publishedAt)}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      component="h3"
                      gutterBottom
                      sx={{ 
                        fontWeight: 500,
                        lineHeight: 1.3,
                        mb: 1
                      }}
                    >
                      {article.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {article.shortDescription || article.contentSnippet || 
                       "Click to read this insightful article."}
                    </Typography>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="body2" color="text.secondary">
                        By {article.authorName}
                      </Typography>
                      
                      {/* Add Tags display */}
                      {article.tags && article.tags.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {article.tags.slice(0, 2).map((tag, index) => (
                            <Chip
                              key={`tag-${index}`}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="default"
                              // Remove RouterLink and clickable props
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Browse all articles link */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            component={RouterLink} 
            to="/essays"
            variant="outlined" 
            size="large"
            sx={{ mt: 2 }}
          >
            Browse All Articles
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;

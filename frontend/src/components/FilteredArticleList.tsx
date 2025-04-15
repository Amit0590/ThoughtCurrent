import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';
import { useGetArticlesByFilterQuery } from '../redux/api/articlesApi';

// Helper function to format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) { 
    return 'Invalid Date'; 
  }
};

interface FilteredArticleListProps {
  filterType: 'category' | 'tag';
}

const FilteredArticleList: React.FC<FilteredArticleListProps> = ({ filterType }) => {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';

  // Use the RTK Query hook
  const { data: articles, isLoading, isError, error } = useGetArticlesByFilterQuery(
    { filterType, name: decodedName },
    { skip: !decodedName } // Skip query if name is not available
  );

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Loading articles for {filterType}: {decodedName}...
        </Typography>
        <Paper elevation={1} sx={{ p: 3 }}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="text" height={60} sx={{ mb: 2 }} />
          ))}
        </Paper>
      </Container>
    );
  }

  // Error state
  if (isError) {
    console.error(`Error fetching articles by ${filterType}:`, error);
    let errorMessage = `Could not load articles for ${filterType}: ${decodedName}.`;
    
    if (error && 'data' in error && typeof error.data === 'object' && error.data && 'error' in error.data) {
      errorMessage = `Error: ${error.data.error}`;
    } else if (error && 'message' in error) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{errorMessage}</Alert>
      </Container>
    );
  }

  // Empty state
  const EmptyState = () => (
    <Box sx={{ 
      textAlign: 'center', 
      py: 6, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 2 
    }}>
      <FilterListIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
      <Typography variant="h6" color="text.secondary">
        No articles found for {filterType}: "{decodedName}"
      </Typography>
    </Box>
  );

  // Success state with articles
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Articles - {filterType === 'category' ? 'Category' : 'Tag'}:
        <Chip 
          label={decodedName} 
          sx={{ ml: 1, fontSize: '1.2rem', height: 'auto', p: 0.5 }} 
          color={filterType === 'category' ? 'primary' : 'default'}
        />
      </Typography>

      {!articles || articles.length === 0 ? <EmptyState /> : (
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
          <List>
            {articles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', py: 2 }}>
                  <Typography
                    component={RouterLink}
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
                    {article.publishedAt ? 
                      ` • Published: ${formatDate(article.publishedAt)}` : 
                      (article.createdAt ? ` • Created: ${formatDate(article.createdAt)}` : '')
                    }
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {article.shortDescription || 
                      (article.content?.replace(/<[^>]*>/g, '').substring(0, 150) + '...')}
                  </Typography>
                  
                  {/* Display other tags/categories */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {filterType !== 'category' && article.categories && article.categories.map((cat, idx) => (
                      <Chip 
                        key={`cat-${idx}`} 
                        label={cat} 
                        size="small" 
                        variant="outlined"
                        component={RouterLink}
                        to={`/category/${encodeURIComponent(cat)}`}
                        clickable
                        color="primary"
                      />
                    ))}
                    
                    {filterType !== 'tag' && article.tags && article.tags.map((tag, idx) => (
                      <Chip 
                        key={`tag-${idx}`} 
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        component={RouterLink}
                        to={`/tag/${encodeURIComponent(tag)}`}
                        clickable
                      />
                    ))}
                  </Box>
                </ListItem>
                {index < articles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default FilteredArticleList;

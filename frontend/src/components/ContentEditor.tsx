import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface ArticleFormInputs {
  title: string;
  content: string;
}

const ContentEditor: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ArticleFormInputs>();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const onSubmit: SubmitHandler<ArticleFormInputs> = async (data) => {
    if (!user) {
      setSnackbarMessage('You must be logged in to save drafts');
      setShowSnackbar(true);
      return;
    }

    setLoading(true);

    try {
      // 1. Get Firebase ID Token
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // 2. Construct Request Body
      const requestBody = {
        title: data.title,
        content: data.content,
        authorName: user.displayName || "Unknown Author",
      };

      // 3. Define Cloud Function URL
      const functionUrl = 
        "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/createArticle";

      // 4. Make POST request
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      // 5. Handle Success
      if (response.ok && responseData.success) {
        setSnackbarMessage(`Article draft saved! ID: ${responseData.articleId}`);
        setShowSnackbar(true);
      } else {
        throw new Error(responseData.error || responseData.message || `Request failed`);
      }
    } catch (error: any) {
      console.error("Error submitting article:", error);
      setSnackbarMessage(`Error saving draft: ${error.message}`);
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Article
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register("title", { required: "Title is required" })}
            label="Title"
            fullWidth
            margin="normal"
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            {...register("content", { required: "Content is required" })}
            label="Content"
            fullWidth
            margin="normal"
            multiline
            rows={10}
            error={!!errors.content}
            helperText={errors.content?.message}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Draft'}
          </Button>
        </form>
      </Paper>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ContentEditor;

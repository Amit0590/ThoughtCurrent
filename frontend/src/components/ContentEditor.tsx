import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  CircularProgress,
  Box,
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { auth } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ArticleFormInputs {
  title: string;
  content: string;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link'],
    ['clean']
  ],
} as const;

const ContentEditor: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const isEditing = Boolean(articleId);
  const navigate = useNavigate();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ArticleFormInputs>({
    defaultValues: {
      title: '',
      content: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [initialDataLoading, setInitialDataLoading] = useState<boolean>(isEditing);
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

  useEffect(() => {
    const loadArticleForEdit = async () => {
      if (!isEditing || !articleId) {
        setInitialDataLoading(false);
        return;
      }

      setInitialDataLoading(true);

      try {
        const token = await auth.currentUser?.getIdToken();
        const functionUrl = `https://us-central1-psychic-fold-455618-b9.cloudfunctions.net/getArticle?id=${articleId}`;

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(functionUrl, { method: 'GET', headers });
        const responseData = await response.json();

        if (response.ok) {
          reset({
            title: responseData.title,
            content: responseData.content
          });
        } else {
          throw new Error(responseData.error || `Failed to load article`);
        }
      } catch (error: any) {
        setSnackbarMessage(`Error loading article: ${error.message}`);
        setShowSnackbar(true);
        navigate('/dashboard');
      } finally {
        setInitialDataLoading(false);
      }
    };

    loadArticleForEdit();
  }, [articleId, isEditing, navigate, reset]);

  const onValidationError = (errors: any) => {
    setSnackbarMessage("Please fix the errors in the form.");
    setShowSnackbar(true);
  };

  const onSubmit: SubmitHandler<ArticleFormInputs> = async (data) => {
    if (!user) {
      setSnackbarMessage('You must be logged in to save drafts');
      setShowSnackbar(true);
      return;
    }

    if (!data.content || data.content.trim() === '<p><br></p>') {
      setSnackbarMessage('Content cannot be empty');
      setShowSnackbar(true);
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const requestBody = {
        title: data.title,
        content: data.content,
        authorName: user?.displayName || "Unknown Author",
      };

      const baseUrl = "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net";
      const functionUrl = isEditing 
        ? `${baseUrl}/updateArticle?id=${articleId}` // Updated URL for edit mode
        : `${baseUrl}/createArticle`;

      const response = await fetch(functionUrl, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("[onSubmit] Response Status OK:", response.ok);
      console.log("[onSubmit] Response Data:", responseData);

      if (response.ok && responseData && responseData.success === true) {
        console.log("[onSubmit] Success conditions met!");
        const successMessage = isEditing 
          ? `Article updated! ID: ${articleId}` 
          : `Article draft saved! ID: ${responseData.articleId}`;
        
        console.log("[onSubmit] Setting Snackbar message:", successMessage);
        setSnackbarMessage(successMessage);
        setShowSnackbar(true);
        console.log("[onSubmit] setShowSnackbar(true) called.");
        
        // Delay navigation to allow Snackbar to show
        setTimeout(() => {
          navigate(isEditing ? `/article/${articleId}` : '/dashboard');
        }, 1500);
      } else {
        console.error("[onSubmit] Success conditions NOT met.", {
          responseOk: response.ok,
          responseData
        });
        throw new Error(
          responseData?.error || 
          responseData?.message || 
          `Request failed with status ${response.status}`
        );
      }
    } catch (error: any) {
      console.error("[onSubmit] Caught error:", error);
      setSnackbarMessage(`Error saving draft: ${error.message}`);
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setShowSnackbar(false);

  return (
    <Container maxWidth="lg">
      {initialDataLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            {isEditing ? 'Edit Article' : 'Create New Article'}
          </Typography>
          <form onSubmit={handleSubmit(onSubmit, onValidationError)}>
            <TextField
              {...register("title", { required: "Title is required" })}
              label="Title"
              fullWidth
              margin="normal"
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <Box sx={{ 
              mt: 2, 
              mb: 3, 
              border: errors.content ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)', 
              borderRadius: 1,
              '.ql-editor': {
                minHeight: '250px'
              }
            }}>
              <Controller
                name="content"
                control={control}
                rules={{
                  validate: (value) => {
                    const textContent = value?.replace(/<[^>]*>/g, '').trim();
                    if (!textContent) {
                      return 'Content cannot be empty';
                    }
                    return true;
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={quillModules}
                    placeholder="Write your article content here..."
                    style={{ 
                      height: '300px',
                      marginBottom: '50px'
                    }}
                  />
                )}
              />
            </Box>
            {errors.content && (
              <Typography 
                color="error" 
                variant="caption" 
                sx={{ display: 'block', mb: 2, ml: 1 }}
              >
                {errors.content.message}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || initialDataLoading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Article' : 'Save Draft')}
            </Button>
          </form>
        </Paper>
      )}
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

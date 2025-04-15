import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  CircularProgress,
  Box,
  Autocomplete,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { auth } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  useCreateArticleMutation, 
  useUpdateArticleMutation, 
  useGetArticleByIdQuery, 
  FUNCTION_URLS
} from '../redux/api/articlesApi';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

// Create Delta constructor from Quill
const Delta = Quill.import('delta');

// Update the form inputs interface
interface ArticleFormInputs {
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  shortDescription: string;
  status: 'draft' | 'published';
}

const ContentEditor: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const isEditing = Boolean(articleId);
  const navigate = useNavigate();
  
  // RTK Query hooks
  const [createArticle, { isLoading: isCreating }] = useCreateArticleMutation();
  const [updateArticle, { isLoading: isUpdating }] = useUpdateArticleMutation();
  const { data: articleData, isLoading: isArticleLoading } = 
    useGetArticleByIdQuery(articleId || '', { skip: !articleId });
  
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<ArticleFormInputs>({
    defaultValues: {
      title: '',
      content: '',
      categories: [],
      tags: [],
      shortDescription: '',
      status: 'draft'
    }
  });
  
  // Add state for pending uploads
  const [pendingUploads, setPendingUploads] = useState<Map<string, File>>(new Map());
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [initialDataLoading, setInitialDataLoading] = useState<boolean>(isEditing);
  const user = useSelector((state: RootState) => state.auth.user);
  const quillRef = useRef<ReactQuill>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // Load article data when editing
  useEffect(() => {
    if (articleData && isEditing) {
      reset({
        title: articleData.title || '',
        content: articleData.content || '',
        categories: articleData.categories || [],
        tags: articleData.tags || [],
        shortDescription: articleData.shortDescription || '',
        status: articleData.status || 'draft'
      });
      setInitialDataLoading(false);
    } else if (!isArticleLoading && !articleData && isEditing) {
      // Article not found or error fetching
      setSnackbarMessage("Could not load article. It may have been deleted or you don't have permission to view it.");
      setShowSnackbar(true);
      navigate('/dashboard');
    } else if (!isEditing) {
      setInitialDataLoading(false);
    }
  }, [articleData, isEditing, isArticleLoading, navigate, reset]);

  const onValidationError = () => {
    setSnackbarMessage("Please fix the errors highlighted in the form.");
    setShowSnackbar(true);
  };

  // Helper function to process pending images
  const processPendingImages = async (
    currentContent: string,
    uploadsMap: Map<string, File>
  ): Promise<{ finalHtml: string; primaryImageUrl: string | null }> => {
    console.log(`[processPendingImages] Processing ${uploadsMap.size} pending images.`);
    let primaryImageUrl: string | null = null;

    if (uploadsMap.size === 0) {
      return { finalHtml: currentContent, primaryImageUrl };
    }

    // Use DOMParser to safely handle HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentContent, 'text/html');
    const imagesToUpload: { element: HTMLImageElement; tempId: string; file: File }[] = [];

    // Find images with the pending attribute that are still in the map
    doc.querySelectorAll('img[data-pending-upload-id]').forEach(imgElement => {
      const tempId = imgElement.getAttribute('data-pending-upload-id');
      if (tempId && uploadsMap.has(tempId)) {
        imagesToUpload.push({
          element: imgElement as HTMLImageElement,
          tempId: tempId,
          file: uploadsMap.get(tempId)!
        });
      } else if (tempId) {
        // Image was likely deleted from editor, remove from map
        uploadsMap.delete(tempId);
      }
    });

    if (imagesToUpload.length === 0) {
      console.log("[processPendingImages] No pending images found in current content.");
      return { finalHtml: currentContent, primaryImageUrl };
    }

    console.log(`[processPendingImages] Found ${imagesToUpload.length} images to upload.`);

    // Create upload promises
    const uploadPromises = imagesToUpload.map(async ({ tempId, file }) => {
      try {
        const publicUrl = await uploadSingleImage(file);
        return { tempId, publicUrl, success: true };
      } catch (error) {
        console.error(`Failed to upload image with tempId ${tempId}:`, error);
        return { tempId, publicUrl: null, success: false, error };
      }
    });

    // Wait for all uploads to settle
    const results = await Promise.allSettled(uploadPromises);

    // Process results and update image elements
    let allSucceeded = true;
    results.forEach((result, index) => {
      const { element, tempId, file } = imagesToUpload[index];
      if (result.status === 'fulfilled' && result.value.success && result.value.publicUrl) {
        console.log(`[processPendingImages] Replacing ${tempId} with ${result.value.publicUrl}`);
        element.setAttribute('src', result.value.publicUrl);
        element.removeAttribute('data-pending-upload-id');
        
        // Set the first successful upload as the primary image URL
        if (primaryImageUrl === null) {
          primaryImageUrl = result.value.publicUrl;
          console.log(`[processPendingImages] Set primary image URL to: ${primaryImageUrl}`);
        }
      } else {
        allSucceeded = false;
        const errorMsg = result.status === 'rejected' ? result.reason : (result.value as any).error;
        console.error(`[processPendingImages] Upload failed for ${tempId} (${file.name}):`, errorMsg);
        element.setAttribute('style', 'border: 2px solid red; opacity: 0.5;');
        element.removeAttribute('data-pending-upload-id');
      }
    });

    // Serialize the modified document back to HTML
    const finalHtml = doc.body.innerHTML;

    if (!allSucceeded) {
      throw new Error("One or more image uploads failed. Please review the content and try again.");
    }

    console.log("[processPendingImages] Image processing complete.");
    return { finalHtml, primaryImageUrl };
  };
  
  // Modified onSubmit function with deferred image upload logic
  const onSubmit: SubmitHandler<ArticleFormInputs> = async (data) => {
    if (!user) {
      setSnackbarMessage('You must be logged in to save articles');
      setShowSnackbar(true);
      return;
    }

    if (!data.content || data.content.trim() === '<p><br></p>') {
      setSnackbarMessage('Content cannot be empty');
      setShowSnackbar(true);
      return;
    }

    setLoading(true);
    setIsUploadingImages(true);
    setSnackbarMessage("Processing images...");
    setShowSnackbar(true);

    const quill = quillRef.current?.getEditor();
    if (!quill) {
      setSnackbarMessage("Editor not available.");
      setShowSnackbar(true);
      setLoading(false);
      setIsUploadingImages(false);
      return;
    }

    let finalContent = data.content;
    let primaryImageUrl: string | null = null;

    try {
      // Process pending images - upload and replace URLs
      const imageProcessingResult = await processPendingImages(finalContent, pendingUploads);
      finalContent = imageProcessingResult.finalHtml;
      primaryImageUrl = imageProcessingResult.primaryImageUrl;
      
      // Clear pending uploads after successful processing
      setPendingUploads(new Map());
      setIsUploadingImages(false);
      
      setSnackbarMessage("Saving article...");
      setShowSnackbar(true);

      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Prepare article data with processed content
      const articleData = {
        title: data.title,
        content: finalContent, // Use processed content with uploaded image URLs
        shortDescription: data.shortDescription,
        status: data.status,
        authorName: user?.displayName || "Unknown Author",
        categories: data.categories || [],
        tags: data.tags || [],
        imageUrl: primaryImageUrl, // Add the primary image URL
      };

      console.log("[onSubmit] Submitting final article data:", articleData);

      // Use RTK Query mutations
      let result;
      if (isEditing && articleId) {
        console.log(`[onSubmit] Updating existing article ${articleId}`);
        result = await updateArticle({
          id: articleId,
          article: articleData
        }).unwrap();
        console.log(`[onSubmit] Update result:`, result);
        
        if (result.success) {
          console.log(`[onSubmit] Update successful, article ID: ${articleId}`);
        }
      } else {
        result = await createArticle(articleData).unwrap();
      }

      // Handle success - keep existing logic
      const returnedArticleId = isEditing ? articleId : 
        ('articleId' in result ? result.articleId : undefined);
        
      if (!returnedArticleId) {
        throw new Error("Failed to get article ID from response");
      }

      const successMsg = data.status === 'published'
        ? `Article ${isEditing ? 'updated and published' : 'published'}! ID: ${returnedArticleId}`
        : `Article draft ${isEditing ? 'updated' : 'saved'}! ID: ${returnedArticleId}`;

      setSnackbarMessage(successMsg);
      setShowSnackbar(true);

      // Navigate based on status
      setTimeout(() => {
        navigate(data.status === 'published' ? `/article/${returnedArticleId}` : '/articles');
      }, 1500);
    } catch (error: any) {
      console.error("[onSubmit] Error:", error);
      setSnackbarMessage(`Error: ${error.message || 'Failed to save article'}`);
      setShowSnackbar(true);
      // Don't clear pendingUploads on error so user can retry
    } finally {
      setLoading(false);
      setIsUploadingImages(false);
    }
  };

  // Helper function to upload a single image
  const uploadSingleImage = async (file: File): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated for image upload.');
    }
    
    console.log(`[uploadSingleImage] Uploading: ${file.name}`);
    const token = await auth.currentUser.getIdToken(true);
    if (!token) throw new Error('Could not get auth token.');

    const signedUrlFunctionUrl = FUNCTION_URLS.generateSignedUploadUrl;

    let getUrlResponse, signedUrlData;
    try {
      getUrlResponse = await fetch(signedUrlFunctionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type 
        }),
      });
      
      signedUrlData = await getUrlResponse.json();
      if (!getUrlResponse.ok || !signedUrlData.signedUrl) {
        throw new Error(signedUrlData.error || 'Failed to get upload URL.');
      }
    } catch (err: any) {
      console.error("Error getting signed URL:", err);
      throw new Error(`Failed to get upload URL for ${file.name}: ${err.message}`);
    }

    try {
      const uploadResponse = await fetch(signedUrlData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`GCS upload failed: ${uploadResponse.statusText}`);
      }
      
      console.log(`[uploadSingleImage] Successfully uploaded: ${file.name}`);
      return signedUrlData.publicUrl; // Return the final GCS URL
    } catch (err: any) {
      console.error("Error uploading to GCS:", err);
      throw new Error(`Failed to upload ${file.name} to GCS: ${err.message}`);
    }
  };

  // --- Function to handle file processing (used by both button handler and paste handler) ---
  const processAndPreviewImage = debounce((file: File) => {
    console.log('Processing file for preview:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64DataUrl = e.target?.result as string;
      if (base64DataUrl && quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        
        // Generate a unique ID for this pending image
        const tempId = `pending-${uuidv4()}`;

        // Store the file in pendingUploads
        setPendingUploads(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(tempId, file);
          console.log(`[processAndPreviewImage] Added ${tempId} to pending uploads. Map size: ${newMap.size}`);
          return newMap;
        });

        // Insert image with data URL - Fix: use string literal 'user' instead of Quill.sources.USER
        quill.insertEmbed(range.index, 'image', base64DataUrl, 'user');
        
        // Apply our custom attribute to track the image
        // Use timeout to ensure embed is in DOM before formatting
        setTimeout(() => {
          quill.formatText(range.index, 1, { 'data-pending-upload-id': tempId });
          // Fix: set selection with correct parameters (index, length, source)
          quill.setSelection(range.index + 1, 0, 'silent');
          console.log(`[processAndPreviewImage] Inserted preview for ${tempId}`);
        }, 0);
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setSnackbarMessage("Error reading file for preview.");
      setShowSnackbar(true);
    };
    
    reader.readAsDataURL(file);
  }, 100); // 100ms debounce time

  // --- Modified imageHandler to use the shared processing function ---
  const imageHandler = useCallback(() => {
    console.log("Custom image handler triggered");
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const files = input.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log('Selected file:', file);
        processAndPreviewImage(file);
      }
    };
  }, [processAndPreviewImage]);

  // --- Define Quill modules with custom clipboard matchers ---
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        'image': imageHandler
      }
    },
    clipboard: {
      // Custom matcher for pasted images
      matchers: [
        ['img', (node: HTMLImageElement, delta: any) => {
          // Check if the src is a data URL
          if (node.src && node.src.startsWith('data:image/')) {
            console.log("[Clipboard Matcher] Intercepted pasted data URL image");
            // Return empty delta to prevent default insertion
            // We'll handle it in the text-change event handler
            return new Delta();
          }
          // For non-data URLs, let Quill handle normally
          return delta;
        }]
      ]
    },
    // Ensure keyboard module is enabled to handle keyboard inputs
    keyboard: {
      bindings: {}
    }
  }), [imageHandler]);

  // --- Effect to handle pasted/dropped images ---
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleTextChange = (delta: any, oldDelta: any, source: string) => {
      // Only process user changes (paste/drop) - Fix: use string literal 'user' instead of Quill.sources.USER
      if (source !== 'user') return;

      // Check for inserted images with data URLs
      delta.ops?.forEach((op: any) => {
        if (op.insert && typeof op.insert === 'object' && op.insert.image) {
          const imageUrl = op.insert.image;
          
          // Process data URLs without our pending ID
          if (typeof imageUrl === 'string' && 
              imageUrl.startsWith('data:image/') && 
              (!op.attributes || !op.attributes['data-pending-upload-id'])) {
            
            console.log('[text-change] Detected pasted data URL image');
            
            // Convert data URL to File/Blob
            fetch(imageUrl)
              .then(res => res.blob())
              .then(blob => {
                // Create a file from the blob
                const extension = blob.type.split('/')[1] || 'png';
                const fileName = `pasted-image-${Date.now()}.${extension}`;
                const imageFile = new File([blob], fileName, { type: blob.type });

                // Process the file using our shared function
                processAndPreviewImage(imageFile);

                // Try to remove the original pasted image
                // Find and remove all images without our ID attribute
                const currentContent = quill.getContents();
                let index = 0;
                
                const removalDelta = new Delta();
                
                currentContent.ops?.forEach((contentOp: any) => {
                  if (contentOp.insert && 
                      typeof contentOp.insert === 'object' && 
                      contentOp.insert.image && 
                      contentOp.insert.image === imageUrl &&
                      (!contentOp.attributes || !contentOp.attributes['data-pending-upload-id'])) {
                    // Remove this image
                    removalDelta.retain(index).delete(1);
                    console.log('[text-change] Removing original pasted image at index', index);
                  }
                  
                  // Increment index (1 for objects, length for strings)
                  index += (typeof contentOp.insert === 'string') 
                    ? contentOp.insert.length 
                    : 1;
                });
                
                // Apply removals if any were found
                if (removalDelta.ops?.length > 0) {
                  quill.updateContents(removalDelta, 'silent'); // Fix: use 'silent' instead of Quill.sources.SILENT
                }
              })
              .catch(err => {
                console.error("Error processing pasted image:", err);
                setSnackbarMessage("Failed to process pasted image");
                setShowSnackbar(true);
              });
          }
        }
      });
    };

    // Attach text-change listener
    quill.on('text-change', handleTextChange);
    console.log("[ContentEditor] Attached text-change listener for paste handling");

    return () => {
      quill.off('text-change', handleTextChange);
      console.log("[ContentEditor] Removed text-change listener");
    };
  }, [processAndPreviewImage, setSnackbarMessage, setShowSnackbar]);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        console.log("[ContentEditor] Attaching custom image handler...");
        const toolbar = quill.getModule('toolbar');
        if (toolbar) {
          toolbar.addHandler('image', imageHandler);
          console.log("[ContentEditor] Custom image handler attached.");
        } else {
          console.error("[ContentEditor] Quill toolbar module not found.");
        }
      } else {
        console.error("[ContentEditor] Could not get Quill editor instance from ref.");
      }
    }
  }, [imageHandler]);

  const handleCloseSnackbar = () => setShowSnackbar(false);

  return (
    <Container maxWidth="lg">
      {initialDataLoading || isArticleLoading ? (
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

            {/* Short Description Input */}
            <TextField
              {...register("shortDescription")}
              label="Short Description / Excerpt"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              helperText="A brief summary shown on article lists (optional)."
              error={!!errors.shortDescription}
            />

            <Box sx={{ 
              mt: 2, 
              mb: 3, 
              border: errors.content ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)', 
              borderRadius: 1,
              '.ql-editor': {
                minHeight: '250px',
                cursor: 'text',
                pointerEvents: 'auto',
                zIndex: 10
              },
              '.ql-container': {
                pointerEvents: 'auto',
                zIndex: 1
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
                render={({ field }) => (
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={quillModules}
                    placeholder="Write your article content here..."
                    style={{ 
                      height: '300px',
                      marginBottom: '50px'
                    }}
                    readOnly={false}
                    onFocus={() => console.log("Editor focused")}
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
            
            {/* Categories Autocomplete Input */}
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={field.value || []}
                  onChange={(event, newValue) => {
                    field.onChange(newValue);
                  }}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Categories"
                      margin="normal"
                      placeholder="Type category and press Enter"
                      helperText="Enter relevant categories, press Enter after each."
                    />
                  )}
                />
              )}
            />
            
            {/* Tags Autocomplete Input */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={field.value || []}
                  onChange={(event, newValue) => {
                     field.onChange(newValue);
                  }}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Tags"
                      margin="normal"
                      placeholder="Type tag and press Enter"
                      helperText="Enter relevant tags, press Enter after each."
                    />
                  )}
                />
              )}
            />
            
            {/* --- Status Control --- */}
            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">Article Status</FormLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel value="draft" control={<Radio />} label="Draft" />
                    <FormControlLabel value="published" control={<Radio />} label="Published" />
                  </RadioGroup>
                )}
              />
            </FormControl>
            
            {/* Submit Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              {/* Save Draft Button */}
              <Button
                type="submit"
                variant="outlined"
                onClick={() => setValue('status', 'draft')}
                disabled={loading || isUploadingImages || isCreating || isUpdating}
              >
                {loading && !isUploadingImages ? 
                  <CircularProgress size={24} /> : 'Save Draft'}
              </Button>
              
              {/* Publish Button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={() => setValue('status', 'published')}
                disabled={loading || isUploadingImages || isCreating || isUpdating}
              >
                {loading && !isUploadingImages ? 
                  <CircularProgress size={24} /> : 
                  (isEditing ? 'Update & Publish' : 'Publish Now')}
              </Button>
              
              {isUploadingImages && 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="caption">Uploading images...</Typography>
                </Box>
              }
            </Box>
          </form>
        </Paper>
      )}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default ContentEditor;

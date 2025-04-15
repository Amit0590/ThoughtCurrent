import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Article } from '../../types/Article'; // Import from your types directory
import { auth } from '../../firebase'; // Import auth from Firebase

// Define a HomePage article type (subset of full Article)
export interface HomepageArticle {
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

// Define function URLs - updated to Cloud Run URLs
const FUNCTION_URLS = {
  getHomepageArticles: 'https://gethomepagearticles-5am6ohpjdq-uc.a.run.app',
  getArticle: 'https://getarticle-5am6ohpjdq-uc.a.run.app',
  createArticle: 'https://createarticle-5am6ohpjdq-uc.a.run.app',
  updateArticle: 'https://updatearticle-5am6ohpjdq-uc.a.run.app',
  deleteArticle: 'https://deletearticle-5am6ohpjdq-uc.a.run.app',
  listArticles: 'https://listarticles-5am6ohpjdq-uc.a.run.app',
  listPublicArticles: 'https://listpublicarticles-5am6ohpjdq-uc.a.run.app',
  generateSignedUploadUrl: 'https://generatesigneduploadurl-5am6ohpjdq-uc.a.run.app',
  postComment: 'https://postcomment-5am6ohpjdq-uc.a.run.app',
  getComments: 'https://getcomments-5am6ohpjdq-uc.a.run.app',
  getReplies: 'https://getreplies-5am6ohpjdq-uc.a.run.app',
  sendPasswordResetEmail: 'https://sendpasswordresetemail-5am6ohpjdq-uc.a.run.app',
  corsProxy: 'https://corsproxy-5am6ohpjdq-uc.a.run.app'
};

// Create a base query with auth token injection
const baseQueryWithAuth = fetchBaseQuery({
  // The baseUrl is not used anymore since we use complete URLs
  baseUrl: '',
  prepareHeaders: async (headers, api) => {
    // Get the current Firebase auth token
    const token = await auth.currentUser?.getIdToken(true);
    
    // If we have a token, add it to the headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('[articlesApi] Added auth token to request');
    } else {
      console.warn('[articlesApi] No auth token available for request');
    }
    
    return headers;
  }
});

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  baseQuery: baseQueryWithAuth, // Use our custom query with authentication
  tagTypes: ['HomepageArticles', 'Article', 'ArticleList'], // Add 'ArticleList' to tagTypes
  endpoints: (builder) => ({
    // Get featured articles for homepage
    getHomepageArticles: builder.query<HomepageArticle[], void>({
      query: () => FUNCTION_URLS.getHomepageArticles,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'HomepageArticles' as const, id })),
              { type: 'HomepageArticles', id: 'LIST' },
            ]
          : [{ type: 'HomepageArticles', id: 'LIST' }],
    }),
    
    // Get a single article by ID
    getArticleById: builder.query<Article, string>({
      query: (id) => `${FUNCTION_URLS.getArticle}?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Article', id }],
    }),
    
    // Create a new article
    createArticle: builder.mutation<{success: boolean; articleId: string}, Partial<Article>>({
      query: (article) => ({
        url: FUNCTION_URLS.createArticle,
        method: 'POST',
        body: article,
        headers: {
          'Content-Type': 'application/json',
          // Authorization header will be added by interceptor
        },
      }),
      invalidatesTags: [{ type: 'HomepageArticles', id: 'LIST' }]
    }),
    
    // Update an existing article
    updateArticle: builder.mutation<{success: boolean}, {id: string; article: Partial<Article>}>({
      query: ({id, article}) => ({
        url: `${FUNCTION_URLS.updateArticle}?id=${id}`,
        method: 'PUT',
        body: article,
        headers: {
          'Content-Type': 'application/json',
          // Authorization header will be added by interceptor
        },
      }),
      // Improve cache invalidation to ensure updates are reflected
      invalidatesTags: (result, error, { id }) => [
        { type: 'Article', id },
        { type: 'ArticleList', id: 'LIST' },
        { type: 'HomepageArticles', id: 'LIST' }
      ],
      // Add onQueryStarted to handle optimistic updates
      async onQueryStarted({ id, article }, { dispatch, queryFulfilled }) {
        // Log the update attempt
        console.log(`[updateArticle] Starting update for article ${id}`, article);
        
        try {
          const { data } = await queryFulfilled;
          console.log(`[updateArticle] Update successful:`, data);
          
          // Force refetch the article to ensure we have the latest version
          dispatch(articlesApi.util.invalidateTags([{ type: 'Article', id }]));
        } catch (error) {
          console.error(`[updateArticle] Update failed:`, error);
        }
      }
    }),

    // New endpoint for filtering articles by category or tag
    getArticlesByFilter: builder.query<Article[], { filterType: 'category' | 'tag'; name: string }>({
      query: ({ filterType, name }) => {
        const params = new URLSearchParams();
        params.set(filterType, name); // Set either 'category=...' or 'tag=...'
        return `${FUNCTION_URLS.listPublicArticles}?${params.toString()}`;
      },
      providesTags: (result, error, { filterType, name }) => [
        { type: 'ArticleList' as const, id: `${filterType}-${name}` }
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetHomepageArticlesQuery,
  useGetArticleByIdQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useGetArticlesByFilterQuery // Export the new hook
} = articlesApi;

// Export function URLs for direct use in components
export { FUNCTION_URLS };

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { articlesApi } from './api/articlesApi'; // Import the API

const store = configureStore({
  reducer: {
    auth: authReducer,
    [articlesApi.reducerPath]: articlesApi.reducer, // Add the API reducer
  },
  // Adding the API middleware enables caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(articlesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
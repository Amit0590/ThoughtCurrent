// Import Firebase Authentication functions and the auth instance
// import { createUser } from '../../firebase';
import { UserCredential } from 'firebase/auth'; // Add missing import for getAuth

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    // Remove unused import
    // import { signOut } from 'firebase/auth';
    updateProfile // <-- Add this import
} from 'firebase/auth';

// Import the Firebase app instance
import app from '../../firebase';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    displayName?: string;
  } | null;
  loading: boolean; // Add loading state
  error: string | null; // Add error state
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false, // Initialize loading state
  error: null, // Initialize error state
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      // Use the `app` instance in `getAuth`
      const auth = getAuth(app); // Use Firebase auth instance
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password); // Use Firebase signInWithEmailAndPassword function
      const user = { // Extract user data from Firebase UserCredential
        id: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName, // Or other relevant user info from Firebase
      };
      return user; // Return user data for Redux state
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message); // Handle errors using thunkAPI.rejectWithValue
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { firstName: string; lastName: string; email: string; password: string }, thunkAPI) => {
    try {
      // Use the `app` instance in `getAuth`
      const auth = getAuth(app); // Use Firebase auth instance
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

      // --- START: Update Firebase profile ---
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      // --- END: Update Firebase profile ---

      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        // Read the displayName directly from the updated Firebase user object
        displayName: userCredential.user.displayName,
      };
      return user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message); // Handle errors with rejectWithValue
    }
  }
);

// Add loginSuccess action to authSlice reducers
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
    },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.id,
          email: action.payload.email || '', // Ensure email is always a string
          displayName: action.payload.displayName ?? undefined,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.id,
          email: action.payload.email || '', // Ensure email is always a string
          displayName: action.payload.displayName ?? undefined,
        };
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export loginSuccess along with logout
export const { logout, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
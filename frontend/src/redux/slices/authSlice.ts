// Import Firebase Authentication functions and the auth instance
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';

import app from '../../firebase';
import { signInWithGoogle } from '../../firebase';

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
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(
        auth, credentials.email, credentials.password
      );
      
      const serializableUser = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      };
      return serializableUser;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { firstName: string; lastName: string; email: string; password: string }, thunkAPI) => {
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
        console.log("[register thunk] Verification email sent.");
      } catch (verificationError) {
        console.error("[register thunk] Failed to send verification email:", verificationError);
      }

      const updatedUser = getAuth(app).currentUser;

      const serializableUser = {
        id: userCredential.user.uid,
        email: updatedUser?.email || null,
        displayName: updatedUser?.displayName || null,
      };
      return serializableUser;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const auth = getAuth(app); // Use Firebase auth instance
    await auth.signOut(); // Sign out the user from Firebase
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message); // Handle errors during sign-out
  }
});

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, thunkAPI) => {
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        return {
          id: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
        };
      }
      throw new Error('Google sign-in failed');
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

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
      state.user = {
        id: action.payload.id, // Changed from uid to id
        email: action.payload.email || null,
        displayName: action.payload.displayName || null,
      };
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
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.id,
          email: action.payload.email || '',
          displayName: action.payload.displayName ?? undefined,
        };
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export loginSuccess along with logout
export const { logout, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
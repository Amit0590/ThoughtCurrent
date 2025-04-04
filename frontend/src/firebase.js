// Import Firebase app initialization and auth modules
import { initializeApp } from "firebase/app";
// Import Firebase authentication functions
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, setPersistence, browserLocalPersistence } from "firebase/auth"; // Add these imports
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration - get values from Firebase Console
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Error check for missing or incomplete Firebase configuration
if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
    throw new Error("Firebase configuration is missing or incomplete. Check your Firebase project settings and src/firebase.js");
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export auth instance for use in app
export const auth = getAuth(app); // Export auth instance

// Attempt to set persistence explicitly
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to local.");
  })
  .catch((error) => {
    console.error("Error setting Firebase persistence:", error);
  });

// Helper function for user registration with email and password
export const createUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// Helper function for user sign-in with email and password
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Helper function for Google Sign-in with redirect
export const signInWithGoogleRedirect = () => {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(auth, provider); // Initiates the redirect
};

// Helper function for handling redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User signed in via redirect flow!
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      return { credential, token, user };
    }
    return null; // No user signed in via redirect (e.g., redirect wasn't from auth flow)
  } catch (error) {
    console.error("Error handling redirect result:", error);
    return { error }; // Return error info
  }
};

// Helper function for user sign-out
export const signOutUser = () => signOut(auth);

// Export the Firebase app instance
export default app;
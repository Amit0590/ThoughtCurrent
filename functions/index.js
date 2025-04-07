const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");

// Initialize Firebase Admin SDK with explicit configuration
initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "psychic-fold-455618-b9", // Explicit project ID
  databaseURL: "https://psychic-fold-455618-b9.firebaseio.com",
});

// Initialize Firestore with specific settings
const firestore = admin.firestore();
firestore.settings({ignoreUndefinedProperties: true});

exports.createArticle = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are accepted",
    });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.authorization || "";
    if (!/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authorization header must be in format: Bearer <token>",
      });
    }

    // Extract and verify token
    const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Validate required fields
    if (!req.body.title || typeof req.body.title !== "string") {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Title is required and must be a string",
      });
    }

    // Prepare article data
    const articleData = {
      title: req.body.title.trim(),
      content: req.body.content || "",
      authorId: decodedToken.uid,
      authorName: decodedToken.name || "Anonymous Author",
      status: "draft",
      categories: Array.isArray(req.body.categories) ? req.body.categories : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create document in Firestore
    const docRef = await firestore.collection("articles").add(articleData);

    return res.status(201).json({
      success: true,
      articleId: docRef.id,
      message: "Article draft created successfully",
    });
  } catch (error) {
    console.error("Error processing request:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Token Expired",
        message: "Your session has expired. Please sign in again.",
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        error: "Invalid Token",
        message: "Authentication token is invalid or malformed",
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while processing your request",
    });
  }
});

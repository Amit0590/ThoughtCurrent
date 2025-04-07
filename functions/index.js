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

exports.getArticle = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // Validate request method
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET requests are accepted",
    });
  }

  try {
    // Validate article ID parameter
    const articleId = req.query.id;
    if (!articleId || typeof articleId !== "string" || articleId.length === 0) {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Missing or invalid article ID parameter",
      });
    }

    // Get article document
    const articleRef = firestore.collection("articles").doc(articleId);
    const articleDoc = await articleRef.get();

    // Check document existence
    if (!articleDoc.exists) {
      return res.status(404).json({
        error: "Not Found",
        message: "Article not found",
      });
    }

    const articleData = articleDoc.data();
    const articleStatus = articleData.status || "draft";

    // Handle draft access
    if (articleStatus === "draft") {
      // Authentication check
      const authHeader = req.headers.authorization || "";
      if (!/^Bearer\s+/i.test(authHeader)) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required for draft access",
        });
      }

      // Verify token
      const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);

        // Authorization check
        if (decodedToken.uid !== articleData.authorId) {
          return res.status(403).json({
            error: "Forbidden",
            message: "You don't have permission to view this draft",
          });
        }
      } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or expired authentication token",
        });
      }
    } else if (articleStatus !== "published") {
      return res.status(403).json({
        error: "Forbidden",
        message: "This article is not publicly available",
      });
    }

    // Prepare safe response data
    const responseData = {
      id: articleDoc.id,
      title: articleData.title,
      content: articleData.content,
      status: articleStatus,
      createdAt: articleData.createdAt ?
        articleData.createdAt.toDate().toISOString() :
        null,
      updatedAt: articleData.updatedAt ?
        articleData.updatedAt.toDate().toISOString() :
        null,
      authorName: articleData.authorName,
      tags: articleData.tags || [],
      categories: articleData.categories || [],
    };

    // Add cache control for published articles
    if (articleStatus === "published") {
      res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while processing your request",
    });
  }
});

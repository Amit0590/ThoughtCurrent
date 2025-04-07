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

    // Split long log statement
    console.log("[createArticle] Decoded token:", {
      uid: decodedToken.uid,
      name: decodedToken.name,
    });

    // Validate required fields
    if (!req.body.title || typeof req.body.title !== "string") {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Title is required and must be a string",
      });
    }

    // Prepare article data with correct authorId
    const articleData = {
      title: req.body.title.trim(),
      content: req.body.content || "",
      authorId: decodedToken.uid, // Ensure authorId is set from token
      authorName: decodedToken.name || "Anonymous Author",
      status: "draft",
      categories: Array.isArray(req.body.categories) ? req.body.categories : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("[createArticle] Data to save in Firestore:", articleData);

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
    // Split long log into multiple lines
    console.log("[getArticle] Raw articleData fetched from Firestore:",
        JSON.stringify(articleData, null, 2),
    );
    console.log(
        `[getArticle] Article found: ${articleId}, 
        Status: ${articleData.status}`,
    );
    console.log(`[getArticle] AuthorId from Firestore:`, articleData.authorId);

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

    // Prepare safe response data with explicit authorId
    const responseData = {
      id: articleDoc.id,
      title: articleData.title,
      content: articleData.content,
      status: articleStatus,
      authorId: articleData.authorId, // Explicitly include authorId
      authorName: articleData.authorName,
      createdAt: articleData.createdAt ?
        articleData.createdAt.toDate().toISOString() :
        null,
      updatedAt: articleData.updatedAt ?
        articleData.updatedAt.toDate().toISOString() :
        null,
      tags: articleData.tags || [],
      categories: articleData.categories || [],
    };

    console.log(`[getArticle] Preparing to send responseData:`,
        JSON.stringify(responseData, null, 2));

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

exports.updateArticle = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "PUT") {
    console.log(`Method ${req.method} not allowed for update.`);
    res.set("Allow", "PUT");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    // Get articleId from query parameter
    const articleId = req.query.id;
    if (!articleId || typeof articleId !== "string") {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Missing or invalid ID parameter",
      });
    }

    // Verify auth token
    const authHeader = req.headers.authorization || "";
    if (!/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authorization header must be in format: Bearer <token>",
      });
    }

    const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get update data
    const {title, content, categories, tags} = req.body;

    // Validate fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({error: "Bad Request: Title is required"});
    }
    if (content === undefined || typeof content !== "string") {
      return res.status(400).json(
          {
            error: "Bad Request: Content must be a string",
          });
    }

    // Get article reference and check ownership
    const articleRef = firestore.collection("articles").doc(articleId);
    const docSnap = await articleRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({error: "Not Found: Article not found."});
    }

    const existingData = docSnap.data();
    if (existingData.authorId !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Not authorized to modify this article",
      });
    }

    // Update document
    const updateData = {
      title: title.trim(),
      content: content,
      categories: Array.isArray(categories) ?
        categories :
        existingData.categories || [],
      tags: Array.isArray(tags) ?
        tags :
        existingData.tags || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await articleRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      articleId: articleId,
    });
  } catch (error) {
    console.error("Error processing update request:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Token Expired",
        message: "Your session has expired. Please sign in again.",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while processing your request",
    });
  }
});

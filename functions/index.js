const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {Storage} = require("@google-cloud/storage");

// Initialize Firebase Admin SDK with explicit configuration
initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "psychic-fold-455618-b9", // Explicit project ID
  databaseURL: "https://psychic-fold-455618-b9.firebaseio.com",
});

// Initialize Firestore with specific settings
const firestore = admin.firestore();
firestore.settings({ignoreUndefinedProperties: true});

// Initialize Storage client
const storage = new Storage();
const bucketName = "thoughtcurrent-article-images"; // Update bucket name

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

    // Get data from request body, including status,
    // shortDescription, and imageUrl
    const {
      shortDescription,
      status,
      imageUrl,
    } = req.body;

    // Validate required fields
    if (!req.body.title || typeof req.body.title !== "string") {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Title is required and must be a string",
      });
    }

    // Validate status
    const finalStatus = (status === "published") ? "published" : "draft";
    console.log(
        `[createArticle] Received status: 
          "${status}", Final status: "${finalStatus}"`,
    );

    // Prepare article data with correct authorId
    const articleData = {
      title: req.body.title.trim(),
      content: req.body.content || "",
      authorId: decodedToken.uid, // Ensure authorId is set from token
      authorName: decodedToken.name || "Anonymous Author",
      status: finalStatus, // Use the validated status from request
      categories: Array.isArray(req.body.categories) ?
        req.body.categories :
        [],
      tags: Array.isArray(req.body.tags) ?
        req.body.tags :
        [],
      shortDescription: typeof shortDescription === "string" ?
        shortDescription :
        "",
      imageUrl:
        typeof imageUrl === "string" ? imageUrl : null, // Add imageUrl field
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Set publishedAt ONLY if published
      publishedAt: finalStatus === "published" ?
        admin.firestore.FieldValue.serverTimestamp() :
        null,
    };

    console.log("[createArticle] Data to save in Firestore:", articleData);

    // Create document in Firestore
    const docRef = await firestore.collection("articles").add(articleData);

    return res.status(201).json({
      success: true,
      articleId: docRef.id,
      message: `Article ${finalStatus} created successfully`,
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
  // Set CORS headers - make sure these are at the top of the function
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
      shortDescription:
        articleData.shortDescription || "", // shortDescription to the response
      imageUrl: articleData.imageUrl || null, // Also include imageUrl present
      createdAt: articleData.createdAt ?
        articleData.createdAt.toDate().toISOString() :
        null,
      updatedAt: articleData.updatedAt ?
        articleData.updatedAt.toDate().toISOString() :
        null,
      publishedAt: articleData.publishedAt ?
        articleData.publishedAt.toDate().toISOString() :
        null, // Include publishedAt date
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
        error: "Bad Request",
        message: "Article ID is required in the query parameters",
      });
    }

    // Verify auth token
    const authHeader = req.headers.authorization || "";
    if (!/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header",
      });
    }

    const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // FIX: Get ALL update data from request body,
    // including status, shortDescription, and imageUrl
    const {
      title,
      content,
      categories,
      tags,
      shortDescription, // Added missing field
      status, // Added missing field
      imageUrl,
    } = req.body;

    // Validate fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Title is required and must be a non-empty string",
      });
    }
    if (content === undefined || typeof content !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Content must be a string",
      });
    }

    // Validate status
    const finalStatus = (status === "published") ? "published" : "draft";
    console.log(
        `[updateArticle] Received status: 
        "${status}", Final status: "${finalStatus}"`);

    // Get article reference and check ownership
    const articleRef = firestore.collection("articles").doc(articleId);
    const docSnap = await articleRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Not Found",
        message: `Article with ID ${articleId} does not exist`,
      });
    }

    const existingData = docSnap.data();
    if (existingData.authorId !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to update this article",
      });
    }

    // FIX: Update data now includes status, shortDescription, and imageUrl
    const updateData = {
      title: title.trim(),
      content: content,
      categories:
        Array.isArray(categories) ? categories : existingData.categories || [],
      tags: Array.isArray(tags) ? tags : existingData.tags || [],
      shortDescription:
        typeof shortDescription === "string" ? shortDescription :
          existingData.shortDescription || "",
      imageUrl:
        typeof imageUrl === "string" ? imageUrl :
          (existingData.imageUrl !== undefined ? existingData.imageUrl : null),
      status: finalStatus, // Added missing field
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Handle publishedAt logic
    const wasPublished = existingData.status === "published";
    const isPublishing = finalStatus === "published";

    if (isPublishing && !wasPublished) {
      updateData.publishedAt = admin.firestore.FieldValue.serverTimestamp();
      console.log(
          `[updateArticle] Setting publishedAt for article ${articleId}`);
    } else if (!isPublishing && wasPublished) {
      updateData.publishedAt = null;
      console.log(`
        [updateArticle] Clearing publishedAt for article ${articleId}`);
    }

    console.log(`[updateArticle] Data to update for ${articleId}:`, updateData);

    // Perform the update with error handling
    try {
      await articleRef.update(updateData);
      console.log(`[updateArticle] Successfully updated article ${articleId}`);
    } catch (dbError) {
      console.error(
          `[updateArticle] Firestore update failed for ${articleId}:`,
          dbError);
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    return res.status(200).json({
      success: true,
      message: `Article status set to ${finalStatus} and updated successfully`,
      articleId: articleId,
    });
  } catch (error) {
    console.error("Error processing update request:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Token Expired",
        message: "Your authentication token has expired. Please log in again.",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while processing your request",
    });
  }
});

exports.listArticles = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET") {
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    console.log("listArticles (for authenticated user) function invoked.");

    const authHeader = req.headers.authorization || "";
    if (!/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authorization header must be in format: Bearer <token>",
      });
    }

    const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
      console.log("[listArticles] Token verified for UID:", decodedToken.uid);
    } catch (error) {
      console.error("[listArticles] Token verification error:", error);
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired authentication token",
      });
    }

    const authorId = decodedToken.uid;
    const articlesCollection = firestore.collection("articles");
    const query = articlesCollection
        .where("authorId", "==", authorId)
        .orderBy("updatedAt", "desc")
        .limit(25);

    console.log(`[listArticles] Querying articles for authorId: ${authorId}`);
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`No articles found for authorId: ${authorId}.`);
      return res.status(200).json([]);
    }

    const articles = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      articles.push({
        id: doc.id,
        title: data.title,
        status: data.status,
        authorId: data.authorId,
        authorName: data.authorName,
        // Add imageUrl to returned data
        imageUrl: data.imageUrl || null,
        shortDescription: data.shortDescription || null,
        // Include both timestamps for display
        createdAt:
          data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt:
          data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        // Include categories and tags for filtering
        categories: data.categories || [],
        tags: data.tags || [],
      });
    });

    console.log(
        `[listArticles] Returning ${articles.length} 
      articles for user ${authorId}.`);
    return res.status(200).json(articles);
  } catch (error) {
    console.error("Error listing user articles:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve articles",
    });
  }
});

exports.sendPasswordResetEmail = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    const {email} = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({error: "Bad Request: Email is required."});
    }

    console.log(
        `[sendPasswordResetEmail] 
      Request received for email: ${email}`);

    const link = await getAuth().generatePasswordResetLink(email);

    console.log(
        `[sendPasswordResetEmail] 
        Password reset link (for testing): ${link}`);
    console.log(
        `[sendPasswordResetEmail] 
        In production, SEND THIS LINK VIA EMAIL to ${email}`);

    res.status(200).json({
      success: true,
      message: "Password reset process initiated.",
    });
  } catch (error) {
    console.error("[sendPasswordResetEmail] Error:", error);
    res.status(200).json({
      success: true,
      message: "Password reset process initiated (even on internal error).",
    });
  }
});

exports.deleteArticle = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method !== "DELETE") {
    console.log(`Method ${req.method} not allowed for delete.`);
    res.set("Allow", "DELETE");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    console.log("deleteArticle (2nd gen) function invoked.");

    const articleId = req.query.id;
    if (!articleId || typeof articleId !== "string") {
      console.log("Missing or invalid 'id' query parameter for delete.");
      return res.status(400).json({
        error: "Bad Request: Missing or invalid article 'id' parameter.",
      });
    }
    console.log(`Attempting to delete article with ID: ${articleId}`);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header missing or invalid for delete.");
      return res.status(401).json({
        error: "Unauthorized: Missing or invalid Authorization header",
      });
    }
    const idToken = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
      console.log("ID Token verified for delete, UID:", decodedToken.uid);
    } catch (error) {
      console.error("Error verifying ID token for delete:", error);
      return res.status(401).json({
        error: "Unauthorized: Invalid ID token",
      });
    }
    const userId = decodedToken.uid;

    const articleRef = firestore.collection("articles").doc(articleId);
    console.log(`Accessing Firestore doc for delete: articles/${articleId}`);

    try {
      const docSnap = await articleRef.get();
      if (!docSnap.exists) {
        console.log(`Article ${articleId} not found for delete.`);
        return res.status(200).json({
          success: true,
          message: "Article already deleted or not found.",
        });
      }

      const existingData = docSnap.data();
      if (existingData.authorId !== userId) {
        console.log(
            `Forbidden delete: 
            User ${userId} is not author ${existingData.authorId}`,
        );
        return res.status(403).json({
          error:
          "Forbidden: You do not have permission to delete this article.",
        });
      }
      console.log(
          `User ${userId} authorized to delete article ${articleId}.`);
    } catch (dbError) {
      console.error(
          "Firestore error fetching article for delete check:", dbError);
      return res.status(500).json({
        error: "Internal Server Error: Could not verify article ownership.",
      });
    }

    try {
      await articleRef.delete();
      console.log(`Article ${articleId} successfully deleted from Firestore.`);
    } catch (dbError) {
      console.error("Firestore error deleting article:", dbError);
      return res.status(500).json({
        error: "Internal Server Error: Could not delete article.",
      });
    }

    console.log("Sending delete success response...");
    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
      articleId: articleId,
    });
  } catch (error) {
    console.error("Cloud Function uncaught error:", error);
    return res.status(500).json({error: "Internal Server Error"});
  }
});

exports.listPublicArticles = functions.https.onRequest(async (req, res) => {
  // --- CORS ---
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set(
      "Access-Control-Allow-Headers", "Content-Type, Authorization",
  ); // Already includes Authorization
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET") {
    res.set("Allow", "GET");
    return res.status(405).json({error: "Method Not Allowed"});
  }
  // --- End CORS ---

  try {
    // --- Check for Filter Parameters ---
    const categoryFilter = req.query.category;
    const tagFilter = req.query.tag;
    const limit = parseInt(String(req.query.limit)) || 20; // Default limit

    console.log(
        `[listPublicArticles] Request received. 
      Category: "${categoryFilter}", Tag: "${tagFilter}"`);

    const articlesCollection = firestore.collection("articles");
    let query = articlesCollection; // Initialize query

    // --- Apply Filters ---
    query = query.where("status", "==", "published"); // Always filter published

    if (categoryFilter && typeof categoryFilter === "string") {
      console.log(
          `[listPublicArticles] Filtering by category: ${categoryFilter}`);
      // Use array-contains for filtering arrays
      query = query.where("categories", "array-contains", categoryFilter);
    } else if (tagFilter && typeof tagFilter === "string") {
      console.log(`[listPublicArticles] Filtering by tag: ${tagFilter}`);
      // Use array-contains for filtering arrays
      query = query.where("tags", "array-contains", tagFilter);
    }

    // --- Order and Limit ---
    query = query.orderBy("publishedAt", "desc").limit(limit);

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`[listPublicArticles] No articles found matching filter.`);
      return res.status(200).json([]);
    }

    const articles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        authorName: data.authorName || "Unknown Author",
        authorId: data.authorId,
        publishedAt: data.publishedAt ?
          data.publishedAt.toDate().toISOString() :
          null,
        createdAt: data.createdAt ?
          data.createdAt.toDate().toISOString() :
          null,
        shortDescription: data.shortDescription || "",
        content: data.content || "",
        categories: data.categories || [],
        tags: data.tags || [],
      };
    });

    console.log(`[listPublicArticles] Returning ${articles.length} articles.`);
    return res.status(200).json(articles);
  } catch (error) {
    console.error("[listPublicArticles] Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve articles",
    });
  }
});

exports.generateSignedUploadUrl =
  functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json({error: "Method Not Allowed"});
    }

    try {
      console.log("generateSignedUploadUrl function invoked.");

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json(
            {error: "Unauthorized: Missing Authorization"});
      }
      const idToken = authHeader.split("Bearer ")[1];

      let decodedToken;
      try {
        decodedToken = await getAuth().verifyIdToken(idToken);
        console.log("Token verified for UID:", decodedToken.uid);
      } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({error: "Unauthorized: Invalid Token"});
      }

      const {filename, contentType} = req.body;
      if (!filename || !contentType) {
        return res.status(400).json({
          error: "Bad Request: Missing filename or contentType",
        });
      }

      if (!contentType.startsWith("image/")) {
        return res.status(400).json({
          error: "Bad Request: Invalid content type, only images allowed.",
        });
      }

      const filePath =
      `user-uploads/${decodedToken.uid}/${Date.now()}-${filename}`;
      const file = storage.bucket(bucketName).file(filePath);

      const options = {
        version: "v4",
        action: "write",
        expires: Date.now() + 10 * 60 * 1000,
        contentType: contentType,
      };

      console.log(`Generating signed URL for: ${filePath}`);
      const [signedUrl] = await file.getSignedUrl(options);
      console.log("Signed URL generated successfully.");

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

      res.status(200).json({
        success: true,
        signedUrl: signedUrl,
        publicUrl: publicUrl,
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: error.message,
      });
    }
  });

exports.postComment = functions.https.onRequest(async (req, res) => {
  // --- Set CORS headers ---
  res.set("Access-Control-Allow-Origin", "*"); // Be specific in production
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  // --- End CORS Headers ---

  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    console.log("postComment function invoked.");

    // 1. Authentication Check
    const authHeader = req.headers.authorization || "";
    if (!/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: "Unauthorized: Authentication required",
      });
    }
    const idToken = authHeader.replace(/Bearer\s+/i, "").trim();
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
      console.log("[postComment] Token verified for UID:", decodedToken.uid);
    } catch (error) {
      console.error("[postComment] Token verification error:", error);
      return res.status(401).json({error: "Unauthorized: Invalid token"});
    }
    const userId = decodedToken.uid;

    // 2. Input Validation
    const {articleId, text, parentCommentId} = req.body;

    if (!articleId || typeof articleId !== "string") {
      return res.status(400).json({
        error: "Bad Request: Missing or invalid articleId.",
      });
    }
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        error: "Bad Request: Comment text cannot be empty.",
      });
    }
    if (parentCommentId && typeof parentCommentId !== "string") {
      // If parentCommentId is provided, it must be a string
      return res.status(400).json({
        error: "Bad Request: Invalid parentCommentId.",
      });
    }

    // Optional: Validate text length
    if (text.length > 2000) { // Example limit
      return res.status(400).json({
        error: "Bad Request: Comment exceeds maximum length.",
      });
    }

    // 3. Prepare Comment Data
    const commentData = {
      articleId: articleId,
      userId: userId,
      userName: decodedToken.name || "Anonymous", // Use display name from token
      userPhotoUrl: decodedToken.picture || null, // Use photo URL from token
      text: text, // Use provided text
      parentCommentId: parentCommentId || null, // Set to null if not provided
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isDeleted: false,
      moderationStatus: "approved", // Default to approved for now
    };
    console.log("[postComment] Data to save:", commentData);

    // 4. Add Document to Firestore 'comments' Collection
    const commentsCollection = firestore.collection("comments");
    const docRef = await commentsCollection.add(commentData);
    console.log(
        `[postComment] Comment added successfully with ID: ${docRef.id}`,
    );

    // 5. Prepare and Send Success Response
    const savedComment = {id: docRef.id, ...commentData};
    // Convert server timestamp for the response if needed immediately by client
    if (savedComment.createdAt) {
      // This won't be the *exact* server time yet, but close for optimistic UI
      savedComment.createdAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      message: "Comment posted successfully",
      comment: savedComment, // Send back the created comment data
    });
  } catch (error) {
    console.error("[postComment] Error:", error);
    return res.status(500).json({error: "Internal Server Error"});
  }
});

exports.getComments = functions.https.onRequest(async (req, res) => {
  // --- Set CORS headers ---
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  // --- End CORS Headers ---

  if (req.method !== "GET") {
    res.set("Allow", "GET");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  try {
    const articleId = req.query.articleId;

    if (!articleId || typeof articleId !== "string") {
      return res.status(400).json({
        error: "Bad Request: Missing or invalid articleId.",
      });
    }

    console.log(`[getComments] Fetching comments for articleId: ${articleId}`);

    // --- Firestore Query ---
    // Fetch top-level comments first (where parentCommentId is null)
    // Order by creation date (oldest first for typical thread display)
    const commentsCollection = firestore.collection("comments");
    const query = commentsCollection
        .where("articleId", "==", articleId)
        .where("parentCommentId", "==", null) // Get top-level comments
        .where("isDeleted", "==", false) // Exclude soft-deleted comments
        .orderBy("createdAt", "asc") // Oldest first
        .limit(50); // Limit top-level comments initially

    const snapshot = await query.get();

    const comments = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id, // Use the document ID as commentId
        ...data,
        // Convert timestamps - fix optional chaining syntax
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === "function" ?
          data.createdAt.toDate().toISOString() :
          data.createdAt,
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === "function" ?
          data.updatedAt.toDate().toISOString() :
          data.updatedAt,
      });
    });
    // --- End Firestore Query ---

    // NOTE: Fetching replies (nested comments) requires additional queries
    // or a different data structure. We'll handle replies later.
    // For now, this returns only top-level comments.

    console.log(
        `[getComments] Returning 
        ${comments.length} top-level comments for article ` +
      `${articleId}.`,
    );
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Error listing comments:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve comments",
    });
  }
});

exports.getReplies = functions.https.onRequest(async (req, res) => {
  // --- CORS ---
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  if (req.method !== "GET") {
    res.set("Allow", "GET");
    return res.status(405).json({error: "Method Not Allowed"});
  }
  // --- End CORS ---

  try {
    const parentCommentId = req.query.parentId; // Get parentId from query

    console.log(
        `[getReplies] Request received with parentId: "${parentCommentId}"`);
    console.log(`[getReplies] parentId type: ${typeof parentCommentId}`);

    console.log(
        `[getReplies] Fetching replies for parentId: ${parentCommentId}`);

    // --- Firestore Query ---
    // Log the query we're about to execute
    console.log(
        `[getReplies] Executing Firestore query: 
        where("parentCommentId", "==", "${parentCommentId}")`);

    const commentsCollection = firestore.collection("comments");
    const query = commentsCollection
        .where("parentCommentId", "==", parentCommentId)// FilterByparentCmmntId
        .where("isDeleted", "==", false)
        .orderBy("createdAt", "asc") // Oldest replies first
        .limit(50); // Limit replies initially

    const snapshot = await query.get();

    console.log(`[getReplies] Query returned ${snapshot.size} documents`);

    const replies = [];
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          // Use the fixed timestamp conversion approach (no optional chaining)
          createdAt:
            data.createdAt && typeof data.createdAt.toDate === "function" ?
            data.createdAt.toDate().toISOString() :
            data.createdAt,
          updatedAt:
            data.updatedAt && typeof data.updatedAt.toDate === "function" ?
            data.updatedAt.toDate().toISOString() :
            data.updatedAt,
        });
      });
    }
    // --- End Query ---

    console.log(
        `[getReplies] Returning ${replies.length} replies for parent ` +
      `${parentCommentId}.`,
    );
    return res.status(200).json(replies);
  } catch (error) {
    console.error("Error listing replies:", error);
    return res.status(500).json({error: "Internal Server Error"});
  }
});

// --- New Function: getHomepageArticles ---
exports.getHomepageArticles = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // We only support GET requests for this endpoint
  if (req.method !== "GET") {
    res.set("Allow", "GET");
    return res.status(405).json({error: "Method Not Allowed"});
  }

  const firestore = admin.firestore();
  const articlesRef = firestore.collection("articles");
  const numArticles = 6; // Number of articles to display on the homepage

  console.log(
      `[getHomepageArticles] Fetching latest 
      ${numArticles} published articles.`);

  try {
    // First try to find articles with publishedAt field
    let snapshot = await articlesRef
        .where("status", "==", "published")
        .orderBy("publishedAt", "desc")
        .limit(numArticles)
        .get();

    // If no results, fall back to createdAt
    // (for backward compatibility with older articles)
    if (snapshot.empty) {
      console.log(
          `[getHomepageArticles] 
            No articles with publishedAt found, using createdAt fallback.`);
      snapshot = await articlesRef
          .where("status", "==", "published")
          .orderBy("createdAt", "desc")
          .limit(numArticles)
          .get();
    }

    if (snapshot.empty) {
      console.log("[getHomepageArticles] No published articles found.");
      return res.status(200).json([]);
    }

    // Map documents to desired output structure, converting Timestamps
    const articles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        authorName: data.authorName || "Unknown Author",
        // Convert Firestore Timestamps to ISO strings for JSON serialization
        publishedAt: data.publishedAt ?
          data.publishedAt.toDate().toISOString() :
          (data.createdAt ? data.createdAt.toDate().toISOString() : null),
        // Include other fields needed for the homepage card
        imageUrl: data.imageUrl || null,
        shortDescription: data.shortDescription || "",
        categories: data.categories || [],
        tags: data.tags || [],
        // Generate plain text snippet from
        // content if shortDescription is missing
        contentSnippet: !data.shortDescription && data.content ?
          data.content.replace(/<[^>]*>/g, "").substring(0, 150) + "..." :
          "",
      };
    });

    console.log(
        `[getHomepageArticles] Successfully fetched 
        ${articles.length} articles.`);
    return res.status(200).json(articles);
  } catch (error) {
    console.error("[getHomepageArticles] Error fetching articles:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve featured articles",
    });
  }
});
// --- End of New Function ---

exports.corsProxy = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    // Extract target function and parameters from the request
    const targetFunction = req.query.fn; // e.g., "getArticle"
    if (!targetFunction) {
      return res.status(400).json({error: "Missing target function name"});
    }

    // Build the target URL
    const baseUrl = "https://us-central1-psychic-fold-455618-b9.cloudfunctions.net";
    const targetUrl = `${baseUrl}/${targetFunction}`;

    // Forward all query parameters except 'fn'
    const params = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "fn") params.append(key, value);
    });

    const url = params.toString() ?
      `${targetUrl}?${params.toString()}` :
      targetUrl;

    // Forward the request with the same method and headers
    const headers = {...req.headers};
    delete headers.host; // Remove host header

    // Fetch options
    const fetchOptions = {
      method: req.method,
      headers,
      body:
        ["POST", "PUT"].includes(
            req.method) ? JSON.stringify(req.body) : undefined,
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // Forward the response status and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error("CORS Proxy Error:", error);
    res.status(500).json({error: "Error in CORS proxy"});
  }
});

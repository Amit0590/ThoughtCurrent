# Developer AI Context

## Project Overview

This project is a web application built with React, Firebase, and Google Cloud Platform (GCP) services. It includes features such as user authentication, article creation and management, and image uploads. The application is designed to be a content management system (CMS) with a focus on user-generated content.

## Current Development Phase & Status

*   **Phase:** Actively working on **Phase 2: Community Features**.
*   **Phase 1 Status:** **Completed.** Foundational infrastructure, core authentication flows, core CMS CRUD operations, image uploads, category/tag handling, public/private article lists, Rich Text Editor, and basic Firestore security rules/indexes are implemented and functional. Key console warnings addressed.
*   **Phase 2 Status (Discussion System):** Basic comment/reply posting and viewing functionality implemented. Backend Cloud Functions (`postComment`, `getComments`, `getReplies`) deployed. Frontend components (`CommentInput`, `CommentItem`, `CommentThread`) created and integrated. Firestore rules and indexes for `comments` deployed.
*   **Current Focus:** Continue refining Discussion System (e.g., Editing, Deletion, Real-time updates) or move to other Phase 2 features.
*   **Known Issues (Minor):** COOP warnings (Codespaces dev only), Quill deprecation warnings, minor UI polish needed (e.g., autocomplete attributes).

## Google Cloud Platform Service Mapping

*   **User Authentication & Management:** Google Cloud Identity Platform (Firebase Auth)
*   **Backend API & Business Logic:** Google Cloud Functions (Node.js) - Handles articles (CRUD, list), comments (CRUD, list), signed URLs.
*   **Primary Data Storage:** Google Cloud Firestore (`articles`, `comments` collections)
*   **File/Media Storage:** Google Cloud Storage (`thoughtcurrent-article-images` bucket)
*   **Asynchronous Tasks & Notifications:** Google Cloud Pub/Sub (Planned)
*   **CI/CD (Build & Deployment):** Google Cloud Build (Planned)
*   **Monitoring & Logging:** Google Cloud Logging & Monitoring
*   **Hosting (Frontend - Dev):** Create React App Dev Server
*   **Hosting (Frontend - Prod Options):** Firebase Hosting, Cloud Storage Static Site, Cloud Run.
*   **AI/ML Features (Future):** Vertex AI, AutoML, Cloud Natural Language API, Recommendation AI (Potential)

## Project Structure

The project is divided into several key components:

1. **Frontend:** Built with React and Material-UI, the frontend handles user interactions and displays content.
2. **Backend:** Firebase Cloud Functions are used to handle server-side logic, including authentication, article management, and image uploads.
3. **Database:** Firestore is used as the primary database for storing user data, articles, and other content.
4. **Storage:** Google Cloud Storage is used for storing images and other media files.

## Key Features

1. **User Authentication:** Users can sign up, log in, and reset their passwords using email and password or Google authentication.
2. **Article Management:** Users can create, read, update, and delete articles. Articles can be saved as drafts or published.
3. **Rich Text Editor:** A rich text editor (Quill) is used for creating and editing articles, with support for image uploads.
4. **Image Uploads:** Users can upload images to Google Cloud Storage and insert them into their articles.
5. **Categories and Tags:** Articles can be categorized and tagged for better organization and searchability.
6. **Public and Private Articles:** Users can view their own articles and published articles from other users.

## Development Environment

To set up the development environment, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   cd ../functions
   npm install
   ```

3. **Set up Firebase:**
   - Create a Firebase project in the Firebase Console.
   - Enable Firestore, Authentication, and Cloud Storage.
   - Set up Firebase configuration in the `.env` file in the `frontend` directory.

4. **Run the development server:**
   ```bash
   cd frontend
   npm start
   ```

5. **Deploy Firebase functions:**
   ```bash
   cd functions
   npm run deploy
   ```

## Contributing

Contributions are welcome! Please follow these guidelines when contributing to the project:

1. **Fork the repository and create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit them:**
   ```bash
   git commit -m "Add your commit message"
   ```

3. **Push your changes to your forked repository:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a pull request:**
   - Go to the original repository on GitHub.
   - Click on the "Pull requests" tab and create a new pull request.
   - Provide a detailed description of your changes and submit the pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
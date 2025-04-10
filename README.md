# ThoughtCurrent

A sophisticated platform for scholarly discourse and knowledge sharing, focusing on in-depth political and cultural analysis. ThoughtCurrent provides a secure, modern authentication system with both traditional and social login options.

## Core Features

### Phase 1: Core Platform & Refinements (Completed ✅)

*   **Authentication:**
    *   [x] Email/Password Registration & Login (Firebase Auth)
    *   [x] Google Sign-in (Redirect Flow via Firebase Auth)
    *   [x] User Session Persistence
    *   [x] Logout Functionality
    *   [x] Protected Routes
    *   [x] Custom Password Reset Flow
    *   [x] Email Verification Flow
*   **Content Management System (CMS):**
    *   [x] Article CRUD (Create, Read, Update, Delete) via Cloud Functions & Firestore
    *   [x] Rich Text Editor (`react-quill`) Integration
    *   [x] Image Uploads (via Editor to Google Cloud Storage)
    *   [x] Categories & Tags (Input & Storage/Display)
    *   [x] Public Article Listing (`/essays`)
    *   [x] User-Specific Article Listing (`/articles`)
*   **Backend:**
    *   [x] Cloud Functions for Auth/CMS API (Node.js, `firebase-functions/v2`)
    *   [x] Firestore Database Setup (`articles` collection)
    *   [x] Google Cloud Storage Setup (for images)
    *   [x] Basic Firestore Security Rules & Indexes Deployed
*   **Frontend:**
    *   [x] Core Component Structure (React, TS, MUI, Redux, Router)
    *   [x] Auth & CMS Component Implementation
    *   [x] Redux State Management for Auth (Serializable state)
    *   [x] Basic UI/UX Polish & Warning Fixes

### Phase 2: Community Features (Starting Now 🚀)

*   **Discussion System:**
    *   [ ] Comment Posting & Display
    *   [ ] Nested Replies
    *   [ ] Real-time Updates (Optional)
    *   [ ] Moderation Tools (Basic)
    *   [ ] Notifications (Basic)
*   **Collaboration Tools (Planned):**
    *   [ ] Shared Workspaces
    *   [ ] Real-time Document Editing
    *   [ ] Research Group Management
*   **Peer Review System (Planned):**
    *   [ ] Review Assignment
    *   [ ] Feedback Management

### Phase 3: Premium Features & Monetization (Planned)
*   Premium Content Delivery, Advanced Analytics, Resource Management, Subscriptions, etc.

## Technical Architecture

### Frontend Architecture
- **State Management**
  - Redux Toolkit for global state
  - Async operations with createAsyncThunk
  - Type-safe actions and reducers
  - Centralized auth state management

- **Component Structure**
  - Functional components with TypeScript
  - React Hook Form for form management
  - Protected route implementation
  - Lazy loading support

- **UI Framework**
  - Material-UI v5
  - Custom theme configuration
  - Responsive grid system
  - Icon integration

### Authentication Flow
1. **Registration Flow**
   - Form validation
   - Firebase account creation
   - Profile update
   - Automatic login
   - Dashboard redirect

2. **Login Flow**
   - Credential validation
   - Firebase authentication
   - State synchronization
   - Session persistence
   - Protected route access

3. **Google Sign-in Flow**
   - OAuth consent
   - Firebase integration
   - Profile sync
   - State management
   - Automatic redirect

## Setup Guide

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Git
- Firebase account

### Development Setup

1. **Clone and Install**
```bash
git clone [repository-url]
cd ThoughtCurrent
npm install
```

2. **Firebase Configuration**
- Create a project in Firebase Console
- Enable Authentication methods:
  - Email/Password
  - Google Sign-in
- Add a web app to get configuration
- Set authorized domains

3. **Environment Configuration**
```bash
cd frontend
cp .env.example .env
```
Update .env with your Firebase credentials:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. **Start Development Server**
```bash
npm start
```

### Production Deployment
1. Build the application:
```bash
npm run build
```

2. Deploy to hosting:
```bash
firebase deploy
```

## Future Roadmap

### Planned Features
- Password recovery system
- Email verification
- Enhanced profile management
- OAuth provider expansion
- Advanced security features

### In Development
- User profile customization
- Session management improvements
- Performance optimizations
- Enhanced error handling

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

[MIT License](LICENSE)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
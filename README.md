# ThoughtCurrent

A sophisticated platform for scholarly discourse and knowledge sharing, focusing on in-depth political and cultural analysis. ThoughtCurrent provides a secure, modern authentication system with both traditional and social login options.

## Core Features

### Authentication System
- **Email/Password Authentication**
  - Secure registration with email verification
  - Login with email/password
  - Form validation and error handling
  - Password strength requirements
  
- **Social Authentication**
  - Google Sign-in integration
  - Seamless OAuth2.0 flow
  - Profile data synchronization

- **Session Management**
  - Persistent sessions using Firebase Auth
  - Secure token management
  - Automatic token refresh
  - Protected route system

- **User Experience**
  - Clean, modern Material-UI interface
  - Responsive design
  - Loading states and feedback
  - Error notifications via Snackbar
  - Dark theme support

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
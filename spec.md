# Revised Personal PDF Archive Application "Archive" Specification

## System Architecture

- **Frontend**: Next.js with React components and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM for local development
- **Storage**: Encrypted local file storage + Google Drive backup
- **Authentication**: NextAuth.js with multiple provider options
- **Camera Integration**: Web API for camera access + image processing

## Core Features Breakdown

### 1. Multi-User System
- User registration and authentication
- Role-based access control (admin, regular users)
- Admins can only manage users and website settings, cannot view user documents
- Personal document spaces for each user
- Document sharing functionality between users
- User profile management

### 2. Document Storage with Encryption
- PDF upload with server-side encryption
- All files encryped with key inside .env file

### 3. Camera Scan Import
- Direct document scanning via device camera
- Document edge detection and perspective correction
- Image enhancement (contrast, brightness, sharpness)
- Multi-page document scanning
- Automatic conversion of scanned images to PDF
- Mobile-responsive scanning interface

### 4. OCR Integration
- OCR processing on decrypted documents and camera scans
- Encrypted storage of extracted text
- Background processing queue for handling large documents
- Text indexing for secure search functionality

### 5. Google Drive Integration
- Per-user OAuth2 authentication with Google
- Encrypted / Unencryped (option for user) backups to Google Drive
- Import from Google Drive with automatic encryption
- Configurable sync settings per user

### 6. Local Database with Prisma
- SQLite for simple local setup
- Prisma ORM for type-safe database operations
- Schema for users, documents, tags, permissions
- Easy migration path to PostgreSQL for production

## Technology Stack (Updated)

- **Framework**: Next.js 14+ with App Router
- **Frontend**: React, Tailwind CSS, PDF.js for viewing
- **Authentication**: NextAuth.js with multiple providers
- **Database**: SQLite + Prisma ORM
- **Encryption**: crypto-js or node:crypto for file encryption
- **OCR**: Tesseract.js or alternative OCR service
- **Camera Access**: MediaDevices Web API, react-webcam
- **Image Processing**: 
  - opencv.js for edge detection and perspective correction
  - browser-image-compression for optimization
  - jsPDF for PDF conversion
- **File Handling**: Secure upload handlers with encryption middleware
- **Google API**: google-api-nodejs-client package
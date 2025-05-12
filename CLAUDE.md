# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a personal PDF archive application called "Archive" built with Next.js. It's designed to provide secure document storage with encryption, OCR capabilities, camera integration for scanning, and Google Drive backup functionality.

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Frontend**: React 19, Tailwind CSS
- **Authentication**: NextAuth.js v5 with multiple providers (implemented)
- **Database**: SQLite + Prisma ORM v6 (implemented)
- **Encryption**: crypto-js for file encryption (implemented)
- **OCR**: Text extraction capability (partially implemented)
- **Camera Access**: MediaDevices Web API, react-webcam (to be implemented)
- **Image Processing**:
  - browser-image-compression for optimization (implemented)
  - opencv.js for edge detection and perspective correction (to be implemented)
  - jsPDF for PDF conversion (to be implemented)
- **Google API**: Google authentication implemented, Drive API integration (to be implemented)

## Architecture

The project follows a Next.js App Router architecture:

1. **Authentication Layer**: NextAuth.js with Google and Credentials providers (implemented)
2. **Multi-User System**: Role-based access control with USER and ADMIN roles (implemented)
3. **Document Storage**: Server-side encryption for PDFs using AES-256 (implemented)
4. **Camera Integration**: Direct document scanning with image enhancement (to be implemented)
5. **OCR Processing**: Basic OCR support in database schema (partially implemented)
6. **Google Drive Integration**: Google auth implemented, backup functionality (to be implemented)
7. **Local Database**: SQLite with Prisma ORM for persistence (implemented)

## Project Status

This project is in active development. The core authentication system, document storage with encryption, and database setup are implemented. The frontend components, document viewing, and upload functionality are partially implemented. The camera scanning features, OCR processing, and Google Drive integration are still in development.

## Run Project
The user already opened a dev server, no need to run it manually. User will send feedback based on the view on browser.
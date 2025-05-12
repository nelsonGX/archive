# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a personal PDF archive application called "Archive" built with Next.js. It's designed to provide secure document storage with encryption, OCR capabilities, camera integration for scanning, and Google Drive backup functionality.

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Frontend**: React 19, Tailwind CSS
- **Authentication**: NextAuth.js (to be implemented)
- **Database**: SQLite + Prisma ORM (to be implemented)
- **Encryption**: crypto-js or node:crypto for file encryption (to be implemented)
- **OCR**: Tesseract.js or alternative OCR service (to be implemented)
- **Camera Access**: MediaDevices Web API, react-webcam (to be implemented)
- **Image Processing**: 
  - opencv.js for edge detection and perspective correction
  - browser-image-compression for optimization
  - jsPDF for PDF conversion
- **Google API**: google-api-nodejs-client package (to be implemented)

## Architecture

The project follows a Next.js App Router architecture:

1. **Authentication Layer**: NextAuth.js with multiple provider options (to be implemented)
2. **Multi-User System**: Role-based access control (to be implemented)
3. **Document Storage**: Server-side encryption for PDFs (to be implemented)
4. **Camera Integration**: Direct document scanning with image enhancement (to be implemented)
5. **OCR Processing**: Text extraction from documents with encrypted storage (to be implemented)
6. **Google Drive Integration**: Backup and import functionality (to be implemented)
7. **Local Database**: SQLite with Prisma ORM for persistence (to be implemented)

## Project Status

This is a new project in early development stage. Most of the specified features described in spec.md still need to be implemented. The current codebase is a basic Next.js 15 application with React 19 and Tailwind CSS configured.

## Run Project
The user already opened a dev server, no need to run it manually. User will send feedback based on the view on browser.
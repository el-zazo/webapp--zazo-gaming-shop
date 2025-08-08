# Zazo Gaming Shop - Backend

## Overview

This is the backend API server for the Zazo Gaming Shop e-commerce platform. It provides all the necessary endpoints for the frontend application to interact with the database and handle business logic.

## Tech Stack

- **Node.js**: JavaScript runtime
- **@el-zazo/server-creator**: Custom server creation package
- **Mongoose**: MongoDB object modeling tool
- **Joi**: Schema validation library
- **dotenv**: Environment variable management

## Project Structure

```
backend/
├── config/         # Configuration files
├── data/           # Sample data files
├── schemas/        # Database schema definitions
├── .env            # Environment variables (not in version control)
├── .env.example    # Example environment variables
├── index.js        # Main application entry point
└── package.json    # Project dependencies and scripts
```

## API Endpoints

The backend provides RESTful API endpoints for the following resources:

- **Authentication**: User and admin login, registration, and token management
- **Products**: CRUD operations for gaming products
- **Categories**: Product categorization
- **Users**: User account management
- **Orders**: E-commerce order processing
- **Forum**: Community discussion threads and replies
- **Guides**: Gaming guides and tutorials
- **FAQs**: Frequently asked questions

## Database Collections

The backend interacts with the following MongoDB collections:

- Admins
- Users
- Categories
- Products
- ForumThreads
- ForumReplies
- Guides
- Faqs
- ContactMessages
- NewsletterSubscriptions
- Quotes
- Reactions
- Favorites
- Carts
- Orders

For detailed schema information, see the [database schema documentation](../database/database_schema.md).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance

### Installation

1. Clone the repository
2. Navigate to the backend directory
   ```bash
   cd backend
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your specific configuration

### Running the Server

```bash
npm start
```

The server will start on the port specified in your environment variables (default: 3000).

## Environment Variables

The following environment variables should be configured in the `.env` file:

- `PORT`: The port on which the server will run
- `MONGODB_URI`: Connection string for MongoDB
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRATION`: Token expiration time

## Development

For development purposes, you can use the sample data provided in the `data` directory to populate your database with initial content.
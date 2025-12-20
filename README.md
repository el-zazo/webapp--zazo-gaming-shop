# GearUp

## Project Overview

GearUp is a full-stack e-commerce platform specifically designed for gaming hardware and accessories. The application provides a seamless shopping experience for gamers looking to purchase the latest tech for their gaming setups.

## Project Structure

The project is organized into three main components:

- **Frontend**: Next.js application with React, TypeScript, and Tailwind CSS
- **Backend**: Node.js API server using custom server creator package
- **Database**: MongoDB database with comprehensive schema design

## Features

- **User Authentication**: Secure login, registration, and account management
- **Product Catalog**: Browse gaming hardware with advanced filtering options
- **Shopping Cart**: Add products, manage quantities, and checkout
- **Admin Dashboard**: Manage products, orders, and customer data
- **Community Forum**: Discuss gaming hardware and share experiences
- **Build-a-PC Tool**: Interactive tool to help users build compatible PC setups
- **Responsive Design**: Optimized for all devices from mobile to desktop

## Tech Stack

### Frontend

- Next.js 15.x
- React 18.x
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Hook Form with Zod validation

### Backend

- Node.js
- Custom server creator package (@el-zazo/server-creator)
- Joi for validation
- Mongoose for MongoDB ODM

### Database

- MongoDB
- Comprehensive schema design for all application entities

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance

### Installation

1. Clone the repository
2. Set up environment variables
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the values according to your environment
3. Install dependencies

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. Start the development servers

   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend development server
   cd ../frontend
   npm run dev
   ```

## Deployment

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

## Project Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Database Schema](./database/database_schema.md)

## License

ISC

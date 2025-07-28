# RavenDB + AI Agents Shopping Dashboard Sample

A comprehensive sample application demonstrating **RavenDB** integration with **AI Agents** for an e-commerce shopping cart scenario. This full-stack TypeScript application showcases modern database operations, AI-powered conversations, and real-time shopping features.

## Overview

This sample application illustrates how to build a modern shopping platform using:

- **RavenDB Document Database** for data persistence and AI conversations
- **AI Agent Integration** for intelligent customer support
- **Real-time Shopping Cart** with document-based storage
- **Order Management** with RavenDB queries and operations
- **TypeScript Full-Stack** architecture with shared types

## Key RavenDB Features Demonstrated

### 🤖 **AI Agent Integration**
- **Conversation Management**: AI conversations stored as RavenDB documents
- **RAG (Retrieval Augmented Generation)**: AI agent with access to product/order knowledge
- **Chat History**: Persistent conversation threads with usage tracking
- **Tool Calls**: AI function calling for dynamic responses

### 📊 **Document Database Operations**
- **CRUD Operations**: Create, read, update, delete operations on documents
- **Document Sessions**: Proper session management and change tracking
- **Include Queries**: Efficient data loading with single round-trips
- **Collection Organization**: Structured document collections (Orders, Products, Carts, Conversations)

### 🛒 **Shopping Cart System**
- **Document-Based Carts**: Cart storage using RavenDB documents
- **Product Integration**: Product catalog with RavenDB references
- **Real-time Updates**: Live cart synchronization
- **User-Specific Data**: Isolated cart and order data per user

## Features

- **Order Management**: View order history with RavenDB queries and document operations
- **Shopping Cart**: Document-based cart storage with real-time RavenDB updates
- **AI Chat Support**: Intelligent conversations powered by RavenDB AI Agents
- **Product Catalog**: RavenDB product documents with rich metadata
- **Responsive Design**: Modern UI works on desktop and mobile devices
- **Real-time Updates**: Live synchronization using RavenDB sessions
- **Beautiful UI**: Pastel yellow and green design system

## RavenDB Architecture

### Document Collections

```
RavenDB Collections:
├── Orders/              # Order documents with complex structures
├── Products/            # Product catalog with supplier references
├── Carts/              # User shopping carts with cart items
├── @conversations/     # AI conversation documents
├── CurrentChats/       # Current conversation references
└── Companies/          # User/company documents
```

### AI Agent Configuration

The application includes a configured RavenDB AI Agent:
- **Agent ID**: `ravendb-docs-rag-agent`
- **Knowledge Base**: Product and order documentation
- **Capabilities**: Natural language querying, order assistance, product recommendations
- **Integration**: Seamless conversation storage and retrieval

## Project Structure

```
ravendb-shopping-sample/
├── backend/              # Express.js + RavenDB TypeScript API
│   ├── src/
│   │   ├── index.ts         # Main server with RavenDB initialization
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── routes/          # API endpoints with RavenDB operations
│   │   │   ├── orders.ts    # Order management with RavenDB queries
│   │   │   ├── cart.ts      # Cart operations with document storage
│   │   │   ├── chat.ts      # AI conversation integration
│   │   │   └── products.ts  # Product catalog endpoints
│   │   └── services/
│   │       └── databaseService.ts  # RavenDB DocumentStore configuration
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # React TypeScript app
│   ├── src/
│   │   ├── App.tsx          # Main dashboard component
│   │   ├── components/      # React UI components
│   │   │   ├── OrdersPanel.tsx   # Order history with add-to-cart
│   │   │   ├── CartPanel.tsx     # Shopping cart management
│   │   │   └── ChatPanel.tsx     # AI chat interface
│   │   ├── services/        # API integration services
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── App.css          # Design system styles
│   └── package.json
└── .vscode/
    └── tasks.json       # Development workflow tasks
```

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **RavenDB Server** (v6.0 or higher)
- **npm** or **yarn**

### RavenDB Setup

1. **Install RavenDB**: Download and install RavenDB from [ravendb.net](https://ravendb.net)
2. **Start RavenDB Server**: Run RavenDB Management Studio (typically on port 8080)
3. **Create Database**: Create a new database for the sample application
4. **Configure AI Agent**: Set up the AI agent with your preferred configuration

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Development

#### Option 1: Using VS Code Tasks (Recommended)

1. Open the project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Type "Tasks: Run Task"
4. Select "Start Both (Frontend & Backend)"

This will start both servers in watch mode with automatic reloading.

#### Option 2: Manual Start

**Start Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## API Endpoints

### User Management
- `GET /api/userid` - Get current user ID

### Shopping Cart (RavenDB Operations)
- `GET /api/cart?userId=uid` - Get user's cart from RavenDB document
- `POST /api/cart?userId=uid&id=product_id&qty=1` - Add item to RavenDB cart
- `DELETE /api/cart?userId=uid&id=product_id&qty=1` - Remove item from RavenDB cart

### Order Management (RavenDB Queries)
- `GET /api/orders?userId=uid` - Query user's orders from RavenDB
- `POST /api/orders/cancel?userId=uid&id=order_id` - Update order status in RavenDB

### AI Chat (RavenDB Conversations)
- `GET /api/chat?userid=uid` - Get conversation from RavenDB with include
- `POST /api/chat?userid=uid` - Send message to AI agent and store in RavenDB

### Product Catalog (RavenDB Documents)
- `GET /api/products` - Get available products from RavenDB collection

## RavenDB Implementation Details

### Document Storage Patterns

**Cart Documents** (`carts/{userId}`)
```typescript
{
  id: "carts/companies/1-A",
  userId: "companies/1-A", 
  items: [
    {
      id: "products/1-A",
      name: "Product Name",
      price: 29.99,
      quantity: 2
    }
  ]
}
```

**Order Documents** (Complex RavenDB Structure)
```typescript
{
  Company: "companies/1-A",
  Employee: "employees/1-A",
  Lines: [
    {
      Product: "products/1-A",
      ProductName: "Product Name",
      Quantity: 2,
      PricePerUnit: 29.99,
      Discount: 0.1
    }
  ],
  ShipTo: { /* Address details */ },
  "@metadata": { /* RavenDB metadata */ }
}
```

**AI Conversation Documents**
```typescript
{
  Agent: "ravendb-docs-rag-agent",
  Parameters: { userId: "companies/1-A", language: "english" },
  Messages: [
    { role: "user", content: "Help with my order", date: "..." },
    { role: "assistant", content: "{...}", usage: {...} }
  ],
  TotalUsage: { PromptTokens: 150, CompletionTokens: 75 }
}
```

### RavenDB Session Management

The application demonstrates proper RavenDB session usage:
- **Session Per Request**: Each API call opens a new session
- **Include Optimization**: Uses `.include()` for efficient data loading
- **Change Tracking**: Automatic document change detection
- **Bulk Operations**: Efficient multi-document operations

## Features Overview

### Dashboard Layout

The application showcases RavenDB capabilities through a three-panel layout:

1. **Left Panel - Order History**: 
   - Displays orders loaded from RavenDB with complex queries
   - Features "Add to Cart" buttons that update cart documents
   - Shows order status with real-time RavenDB data

2. **Top Right - Shopping Cart**: 
   - Real-time cart backed by RavenDB documents
   - Automatic cart creation and updates
   - Quantity controls with immediate persistence

3. **Bottom Right - AI Chat**: 
   - AI conversations stored as RavenDB documents
   - Conversation history with include optimization
   - AI agent integration with knowledge base

### AI Agent Capabilities

The RavenDB AI agent can assist with:
- **Order Inquiries**: Query order status and details from RavenDB
- **Product Information**: Access product catalog and recommendations
- **Shopping Assistance**: Help with cart operations and checkout
- **Knowledge Base**: Answer questions using stored documentation

### RavenDB Features Demonstrated

- **Document Sessions**: Proper session lifecycle management
- **Change Tracking**: Automatic detection of document modifications
- **Include Queries**: Efficient loading of related documents
- **Collection Queries**: Filtering and sorting large datasets
- **AI Integration**: Seamless AI conversation storage and retrieval
- **Metadata Handling**: Working with RavenDB document metadata
- **Optimistic Concurrency**: Safe concurrent document updates

### Design System

- **Primary Colors**: Pastel yellow (`#fef9e7`) and green (`#f0f9f0`)
- **Typography**: System font stack for optimal readability
- **Icons**: Lucide React for consistent iconography
- **Responsive**: Mobile-first design approach

## Development

### VS Code Tasks

- **Start Both**: Runs both frontend and backend in watch mode
- **Start Backend (Watch)**: Backend only with hot reload
- **Start Frontend (Watch)**: Frontend only with hot reload
- **Build Backend**: Production build for backend
- **Build Frontend**: Production build for frontend

### Code Structure

The project follows TypeScript best practices with:
- Shared type definitions
- Modular component architecture
- Service layer for API calls
- Error handling and loading states

## Technologies Used

### Backend
- **RavenDB**: NoSQL document database with AI agent support
- **Express.js**: Web framework for API endpoints
- **TypeScript**: Type-safe development with shared interfaces
- **RavenDB Client**: Official Node.js client for database operations
- **CORS, Helmet, Compression**: Security and performance middleware
- **Nodemon**: Development hot-reload for rapid iteration

### Frontend
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Shared types with backend for consistency
- **Axios**: HTTP client for RavenDB API integration
- **Lucide React**: Consistent icon system
- **CSS3**: Custom properties for theming and responsive design

### RavenDB Configuration
- **DocumentStore**: Centralized database connection management
- **AI Agent**: Configured with knowledge base and conversation support
- **Indexes**: Automatic and custom indexes for efficient querying
- **Collections**: Organized document storage for different entity types

## Learning Objectives

This sample demonstrates:

1. **RavenDB Integration**: How to properly initialize and use RavenDB in a Node.js application
2. **Document Modeling**: Best practices for structuring documents in a NoSQL database
3. **Session Management**: Proper lifecycle management of RavenDB sessions
4. **AI Agent Integration**: Setting up and using RavenDB's AI capabilities
5. **TypeScript Integration**: Creating type-safe applications with RavenDB
6. **Real-time Operations**: Building responsive applications with document database
7. **Complex Queries**: Advanced querying patterns and optimization techniques

## Contributing

We welcome contributions to improve this RavenDB sample application:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/ravendb-enhancement`)
3. **Make your changes** (ensure RavenDB best practices)
4. **Test thoroughly** with RavenDB operations
5. **Submit a pull request** with detailed description

### Areas for Enhancement
- Additional RavenDB queries and operations
- Extended AI agent capabilities
- Performance optimization examples
- Advanced indexing demonstrations
- Sharding scenarios

## Resources

- [RavenDB Documentation](https://ravendb.net/docs)
- [RavenDB AI Agent Guide](https://ravendb.net/docs/ai-integration)
- [Node.js Client Documentation](https://ravendb.net/docs/api/nodejs)
- [TypeScript with RavenDB](https://ravendb.net/docs/typescript)

## License

This project is a sample application for educational and demonstration purposes. Use it to learn RavenDB concepts and build your own applications.

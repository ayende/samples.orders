# Sample Online Shop (Node.js + React + TypeScript + RavenDB)

This is a sample online shop application with:

- **Frontend:** React + Vite + TypeScript
- **Backend:** Express + TypeScript
- **Database:** RavenDB (Northwind sample model)

## Features

- Browse products
- Add products to cart
- Create orders
- View your orders

## Shared Model

All data models are defined in `src/model.ts` and shared between frontend and backend.

## Running the App

### 1. Start the Backend

```
npx ts-node server.ts
```

### 2. Start the Frontend

```
npm run dev
```

- The backend expects RavenDB to be running at `http://localhost:8080` with the `Northwind` database.
- The frontend runs on Vite's default port (usually 5173).

## Installation

Run the following commands to install all required dependencies:

```sh
npm install
```

---

This is a sample app for demonstration and learning purposes.

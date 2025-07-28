<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Shopping Dashboard Project

This is a TypeScript full-stack application with:
- **Backend**: Express.js server with TypeScript providing REST API endpoints
- **Frontend**: React TypeScript application with a shopping dashboard UI

## Project Structure
- `/backend` - Express.js TypeScript API server
- `/frontend` - React TypeScript application
- Backend runs on port 3001
- Frontend runs on port 3000

## Design Guidelines
- Use pastel colors, mainly pale yellow (#fef9e7) and green (#f0f9f0)
- Follow existing CSS variable conventions defined in App.css
- Maintain responsive design patterns established in the project

## API Endpoints
- `GET /api/userid` - Get current user ID
- `GET /api/cart?userId=uid` - Get user's cart
- `POST /api/cart?userId=uid&id=product_id&qty=1` - Add to cart
- `DELETE /api/cart?userId=uid&id=product_id&qty=1` - Remove from cart
- `GET /api/orders?userId=uid` - Get user's orders
- `POST /api/orders/cancel?userId=uid&id=order_id` - Cancel order
- `GET /api/chat?userid=uid` - Get chat messages
- `POST /api/chat?userid=uid` - Send chat message
- `GET /api/products` - Get available products

## Development
- Backend uses nodemon for hot reloading in development
- Frontend uses Create React App development server
- Both have watch tasks configured in VS Code

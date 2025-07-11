import express from 'express';
import cors from 'cors';
import { DocumentStore, IDocumentSession, QueryStatistics } from 'ravendb';
import { Category, Product, Company, Order, Cart } from './src/model';
import { AiUsage, ToolRequest, ChatResult, createAiAgent, CreateAiAgentBody, startConversation, resumeConversation, ToolResponse } from './src/ravendb-ext';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const store = new DocumentStore('http://127.0.0.1:8080', 'Orders');
store.initialize();

// Represents an action requested by the AI agent to be performed by the frontend
export type UserAction = {
  name: string;
  toolId: string;
  arguments: Record<string, any>;
};

// ShoppingAgentReplySchema: expected shape of AI agent's response
export interface ShoppingAgentReplySchema {
  answer: string;
  orders?: string[];
  products?: string[];
  cart?: Cart;
}

// Get all products (with paging)
app.get('/api/products', async (req, res) => {
  const session = store.openSession();
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 5;
  let stats = new QueryStatistics();
  const products = await session.query<Product>({ collection: 'Products' })
    .statistics(s => { stats = s })
    .whereEquals('Discontinued', false)
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .all();
  res.json({ total: stats.totalResults, products });
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  const session = store.openSession();
  const categories = await session.query<Category>({ collection: 'Categories' }).all();
  res.json(categories);
});

// Get all companies (customers)
app.get('/api/companies', async (req, res) => {
  const session = store.openSession();
  const companies = await session.query<Company>({ collection: 'Companies' }).all();
  res.json(companies);
});

// Create order
app.post('/api/orders', async (req, res) => {
  const session = store.openSession();
  const order: Order = req.body;
  await session.store(order);
  await session.saveChanges();
  res.status(201).json(order);
});

// Get orders for a company (companyId as query param, with paging and statistics)
app.get('/api/orders', async (req, res) => {
  const session = store.openSession();
  const id = req.query.id as string;
  if (id) {
    const order = await session.load<Order>(id as string);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  }
  const companyId = req.query.companyId as string;
  if (!companyId) {
    return res.status(400).json({ error: 'Missing companyId query parameter' });
  }
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 5;
  let stats = new QueryStatistics();
  const orders = await session.query<Order>({ collection: 'Orders' })
    .statistics(s => { stats = s })
    .whereEquals('Company', companyId)
    .orderByDescending('OrderedAt')
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .all();
  res.json({ total: stats.totalResults, orders });
});

// Get cart for a company
app.get('/api/cart', async (req, res) => {
  const session = store.openSession();
  const companyId = req.query.companyId as string;
  if (!companyId) {
    return res.status(400).json({ error: 'Missing companyId query parameter' });
  }
  const cartId = `${companyId}/cart`;
  let cart = await session.load<Cart>(cartId) || { id: cartId, Lines: [] };
  res.json(cart);
});

// Add a product to the cart for a company
async function addToCart(companyId: string, productId: string): Promise<{ success: boolean, message: string }> {
  const session = store.openSession();
  // Load product first and error if not found
  const product = await session.load<Product>(productId);
  if (!product) {
    return { success: false, message: `Product '${productId}' not found` };
  }
  const cartId = `${companyId}/cart`;
  let cart: Cart = await session.load<Cart>(cartId) || { id: cartId, Lines: [] };
  // Check if product already in cart
  let item = cart.Lines.find((l) => l.Product === productId);
  if (item) {
    item.Quantity += 1;
    item.ProductName = product.Name;
    item.PricePerUnit = product.PricePerUnit;
  } else {
    cart.Lines.push({
      Product: productId,
      ProductName: product.Name,
      PricePerUnit: product.PricePerUnit,
      Quantity: 1
    });
  }
  await session.store(cart, cartId);
  await session.saveChanges();
  return { success: true, message: `Product '${product.Name}' added to cart` };
}

app.post('/api/cart', async (req, res) => {
  const { companyId, productId } = req.body;
  if (!companyId || !productId) {
    return res.status(400).json({ error: 'Missing companyId or productId' });
  }
  const result = await addToCart(companyId, productId);
  if (result.success === false) {
    return res.status(404).json(result);
  }
  res.json(result);
});

// Remove a product from the cart for a company
app.delete('/api/cart', async (req, res) => {
  const session = store.openSession();
  const { companyId, productId } = req.body;
  if (!companyId || !productId) {
    return res.status(400).json({ error: 'Missing companyId or productId' });
  }
  const cartId = `${companyId}/cart`;
  let cart: Cart = await session.load<Cart>(cartId) || { id: cartId, Lines: [] };
  cart.Lines = cart.Lines.filter(line => line.Product !== productId);
  await session.store(cart, cartId);
  await session.saveChanges();
  res.json({ success: true });
});

app.post('/api/ai', async (req, res) => {
  let { chatId, prompt, companyId, toolResponses } = req.body;
  let result: ChatResult<ShoppingAgentReplySchema>;
  try {
    if (!chatId) {
      result = await startConversation<ShoppingAgentReplySchema>(
        store.urls[0],
        'ShoppingAgent',
        { company: companyId },
        prompt
      );
      chatId = result.ChatId;
    } else {
      let msg;
      if (toolResponses && toolResponses.length > 0) {
        msg = { toolResponses };
      } else {
        msg = { userPrompt: prompt };
      }
      result = await resumeConversation<ShoppingAgentReplySchema>(store.urls[0], 'ShoppingAgent', chatId, msg);
    }
    const state = {
      chatId: chatId,
      actions: [] as UserAction[],
      answer: '',
      toolResponses: [] as ToolResponse[],
      refreshCart: false,
      orders: new Set<string>(),
      products: new Set<string>()
    };
    while (true) {
      if (result.Response !== null) {
        state.answer = result.Response.answer;
        (result.Response.orders || []).forEach(order => state.orders.add(order));
        (result.Response.products || []).forEach(product => state.products.add(product));
      }
      for (const tool of result.ToolRequests || []) {
        switch (tool.Name) {
          case 'AddToCart':
            state.refreshCart = true;
            const addResult = await addToCart(companyId, tool.Arguments.productId);
            state.toolResponses.push({
              ToolId: tool.ToolId,
              Content: addResult.message
            } as ToolResponse);
            break;
          default:
            state.actions.push({
              name: tool.Name,
              toolId: tool.ToolId,
              arguments: tool.Arguments
            });
            break;
        }
      }
      if (state.toolResponses.length == 0) {
        break; // return to the caller
      }
      result = await resumeConversation<ShoppingAgentReplySchema>(store.urls[0], 'ShoppingAgent', chatId, {
        toolResponses: state.toolResponses
      });
      state.toolResponses = []; // reset for next iteration
    }
    res.json(state);
  } catch (e) {
    console.log('Error handling AI request', e);
    res.status(500).json({ error: 'Error handling AI request' });
  }
});

// Cancel an order for a company
app.post('/api/orders/cancel', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }
  const session = store.openSession();
  const order = await session.load<Order>(orderId);
  if (!order) {
    return res.status(404).json({ error: `Order '${orderId}' not found` });
  }
  // For demo: mark as cancelled (add a CancelledAt field)
  order.CancelledAt = new Date();
  await session.saveChanges();
  res.json({ success: true, message: `Order '${orderId}' was cancelled` });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  createAiAgent(store.urls[0], 'ShoppingAgent', ShoppingAgent);
});

const ShoppingAgent: CreateAiAgentBody = {
  ConnectionStringName: 'OpenAi',
  SystemPrompt: 'You are a helpful AI assistant for an e-commerce platform.\n' +
    'You can help users with product information, order management, and more.',
  OutputSchema: JSON.stringify({
    answer: 'the model reply to the user',
    orders: ['related orders to the last user query'],
    products: ['related products to the last user query'],
  } as ShoppingAgentReplySchema),
  Persistence: {
    Collection: "Chats",
    Expires: null
  },
  Actions: [{
    Name: 'AddToCart',
    Description: 'Add a product to the cart for the current user',
    ParametersSchema: JSON.stringify({
      productId: "the product id to add to the cart"
    })
  }, {
    Name: 'CancelOrder',
    Description: 'Cancel an order for the current user',
    ParametersSchema: JSON.stringify({
      orderId: "the order id to cancel / refund"
    })
  }],
  Queries: [
    {
      Name: 'RecentOrders',
      Query: 'from Orders where Company = $company order by OrderedAt desc limit 10',
      Description: 'Get the most recent orders for the current user',
      ParametersSchema: '{}'
    },
    {
      Name: 'ProductCatalogSearch',
      Description: "semantic search the store product catalog",
      Query: "from Products where vector.search(embedding.text(Name), $query)",
      ParametersSchema: JSON.stringify({ query: ["term or phrase to search in the catalog"] })
    }
  ]
};

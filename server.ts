import express from 'express';
import cors from 'cors';
import { DocumentStore, QueryStatistics } from 'ravendb';
import { Category, Product, Company, Order, CartItem } from './src/model';

const app = express();
app.use(cors());
app.use(express.json());

const store = new DocumentStore('http://localhost:8080', 'Orders');
store.initialize();

// Get all products (with paging)
app.get('/api/products', async (req, res) => {
  const session = store.openSession();
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 5;
  let stats = new QueryStatistics();
  const products = await session.query<Product>({ collection: 'Products' })
    .statistics(s => { stats = s})
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

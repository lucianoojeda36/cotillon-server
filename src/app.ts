import express from 'express';
import usersRoutes from './routes/usersRoutes';
import scrapeRoutes from './routes/scrapeRoutes';
import productsRoutes from './routes/productsRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api', scrapeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);

export default app;

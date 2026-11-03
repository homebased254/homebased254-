import express from 'express';
import dotenv from 'dotenv';
import { registerApiRoutes } from '../server.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Register all API routes for Vercel Serverless Function deployment
registerApiRoutes(app);

export default app;

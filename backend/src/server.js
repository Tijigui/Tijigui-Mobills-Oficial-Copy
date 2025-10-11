import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Adicione as rotas aqui quando as criar
// import authRoutes from './routes/auth.js';
// import accountRoutes from './routes/accounts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
// app.use('/api/auth', authRoutes);
// app.use('/api/accounts', accountRoutes);

// Rota de exemplo para teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Rota de placeholder para contas (substitua por rotas reais)
app.get('/api/accounts', (req, res) => {
  console.log("Aviso: Rota /api/accounts chamada, mas está usando dados de exemplo.");
  res.json([
    { id: '1', name: 'Conta Corrente (Exemplo)', bank: 'Banco Exemplo', balance: 1234.56 },
  ]);
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
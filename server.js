// boba-backend/server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

let orders = []; // "Database" In-Memory kita

// Daftar status pesanan yang mungkin
const POSSIBLE_STATUSES = [
    "tertunda", 
    "dikonfirmasi", 
    "sedang_diproses", 
    "siap_diambil", 
    "selesai", 
    "dibatalkan"
];

// --- API Endpoints ---

// POST /api/orders (MENERIMA pesanan baru)
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;

  if (!newOrder || !newOrder.orderId || !newOrder.items || newOrder.items.length === 0) {
    return res.status(400).json({ message: 'Data pesanan tidak lengkap atau tidak valid.' });
  }

  newOrder.receivedAt = new Date().toISOString();
  // Pastikan status awal adalah 'pending' jika belum di-set oleh frontend
  newOrder.status = newOrder.status || "pending"; 
  // newOrder.server_status = 'received'; // Bisa dihapus jika 'status' sudah cukup

  orders.push(newOrder);
  console.log('Pesanan Baru Diterima:', newOrder.orderId, newOrder.status);
  res.status(201).json({
    message: 'Pesanan berhasil diterima oleh server!',
    orderData: newOrder,
  });
});

// GET /api/orders (MENGAMBIL SEMUA pesanan)
app.get('/api/orders', (req, res) => {
  res.status(200).json({
    message: 'Daftar pesanan berhasil diambil.',
    count: orders.length,
    orders: orders, // Kirim semua pesanan
  });
});

// PATCH /api/orders/:orderId/status (MENGUPDATE STATUS pesanan tertentu)
// :orderId adalah parameter URL yang akan berisi ID pesanan
app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params; // Mengambil orderId dari URL
  const { status: newStatus } = req.body; // Mengambil status baru dari body request

  // Validasi status baru
  if (!newStatus || !POSSIBLE_STATUSES.includes(newStatus)) {
    return res.status(400).json({ 
        message: `Status tidak valid. Status yang diizinkan: ${POSSIBLE_STATUSES.join(', ')}` 
    });
  }

  const orderIndex = orders.findIndex(order => order.orderId === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ message: `Pesanan dengan ID ${orderId} tidak ditemukan.` });
  }

  // Update status pesanan
  orders[orderIndex].status = newStatus;
  orders[orderIndex].lastUpdatedAt = new Date().toISOString(); // Catat waktu update

  console.log(`Status pesanan ${orderId} diupdate menjadi: ${newStatus}`);

  res.status(200).json({
    message: `Status pesanan ${orderId} berhasil diupdate.`,
    updatedOrder: orders[orderIndex],
  });
});


app.get('/', (req, res) => {
  res.send('Selamat datang di Boba Order API! Server berjalan dengan baik.');
});

app.listen(PORT, () => {
  console.log(`Server backend Boba berjalan di http://localhost:${PORT}`);
  console.log(`Endpoint POST pesanan: http://localhost:${PORT}/api/orders`);
  console.log(`Endpoint GET pesanan: http://localhost:${PORT}/api/orders`);
  console.log(`Endpoint PATCH status pesanan: http://localhost:${PORT}/api/orders/:orderId/status`);
});
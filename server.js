// boba-backend/server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

let orders = []; // "Database" In-Memory untuk pesanan

// "Database" In-Memory untuk Toko Boba
// Pindahkan data bobaShopsData dari App.jsx ke sini
let bobaShops = [
  {
    id: 1,
    name: 'Boba Enak Manado Town Square (dari Server)',
    position: [1.4705, 124.8370], // Perkiraan di sekitar Mantos
    menu: [
      { id: 'bms1', name: 'Coklat Boba Spesial', price: 26000 },
      { id: 'bms2', name: 'Teh Susu Manado', price: 23000 },
      { id: 'bms3', name: 'Matcha Lezat', price: 29000 },
    ],
  },
  {
    id: 2,
    name: 'Boba Segar Megamall (dari Server)',
    position: [1.4800, 124.8400], // Perkiraan di sekitar Megamall
    menu: [
      { id: 'bsm1', name: 'Klasik Milk Tea Boba', price: 20000 },
      { id: 'bsm2', name: 'Smoothie Boba Buah Naga', price: 27000 },
      { id: 'bsm3', name: 'Teh Hijau Lemon Boba', price: 22000 },
    ],
  },
  {
    id: 3,
    name: 'Waroeng Boba Paal Dua (dari Server)',
    position: [1.4600, 124.8500], // Perkiraan di area Paal Dua
    menu: [
      { id: 'wbp1', name: 'Kopi Susu Boba', price: 24000 },
      { id: 'wbp2', name: 'Strawberry Cheesecake Boba', price: 28000 },
      { id: 'wbp3', name: 'Avocado Boba Cream', price: 27000 },
    ],
  },
  // Tambahkan lebih banyak toko di Manado jika perlu
];


// Daftar status pesanan yang mungkin
const POSSIBLE_STATUSES = [
    "tertunda",
    "dikonfirmasi",
    "sedang_diproses",
    "siap_diambil",
    "selesai",
    "dibatalkan"
];

// --- API Endpoints untuk PESANAN ---

// POST /api/orders (MENERIMA pesanan baru)
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;

  if (!newOrder || !newOrder.orderId || !newOrder.items || newOrder.items.length === 0) {
    return res.status(400).json({ message: 'Data pesanan tidak lengkap atau tidak valid.' });
  }

  newOrder.receivedAt = new Date().toISOString();
  newOrder.status = newOrder.status || "pending";

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
    orders: orders,
  });
});

// PATCH /api/orders/:orderId/status (MENGUPDATE STATUS pesanan tertentu)
app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status: newStatus } = req.body;

  if (!newStatus || !POSSIBLE_STATUSES.includes(newStatus)) {
    return res.status(400).json({
        message: `Status tidak valid. Status yang diizinkan: ${POSSIBLE_STATUSES.join(', ')}`
    });
  }

  const orderIndex = orders.findIndex(order => order.orderId === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ message: `Pesanan dengan ID ${orderId} tidak ditemukan.` });
  }

  orders[orderIndex].status = newStatus;
  orders[orderIndex].lastUpdatedAt = new Date().toISOString();

  console.log(`Status pesanan ${orderId} diupdate menjadi: ${newStatus}`);

  res.status(200).json({
    message: `Status pesanan ${orderId} berhasil diupdate.`,
    updatedOrder: orders[orderIndex],
  });
});

// --- API Endpoints untuk TOKO BOBA ---
// GET /api/shops (MENGAMBIL SEMUA data toko boba)
app.get('/api/shops', (req, res) => {
  res.status(200).json({
    message: 'Daftar toko boba berhasil diambil dari server.',
    shops: bobaShops, // Kirim semua data toko
  });
});

// (NANTI ANDA BISA MENAMBAHKAN ENDPOINT LAIN UNTUK MENGEDIT/MENAMBAH TOKO DI SINI)
// Contoh:
// POST /api/shops (untuk menambah toko baru)
// PUT /api/shops/:shopId (untuk mengupdate toko)
// DELETE /api/shops/:shopId (untuk menghapus toko)


app.get('/', (req, res) => {
  res.send('Selamat datang di Boba Order API! Server berjalan dengan baik.');
});

app.listen(PORT, () => {
  console.log(`Server backend Boba berjalan di http://localhost:${PORT}`);
  console.log(`Endpoint POST pesanan: http://localhost:${PORT}/api/orders`);
  console.log(`Endpoint GET pesanan: http://localhost:${PORT}/api/orders`);
  console.log(`Endpoint PATCH status pesanan: http://localhost:${PORT}/api/orders/:orderId/status`);
  console.log(`Endpoint GET toko: http://localhost:${PORT}/api/shops`); // Log baru
});
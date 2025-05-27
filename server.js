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
let bobaShops = [
  {
    id: 1,
    name: 'Boba Enak Manado Town Square (dari Server)',
    position: [1.4705, 124.8370],
    menu: [
      { id: 'bms1', name: 'Coklat Boba Spesial', price: 26000 },
      { id: 'bms2', name: 'Teh Susu Manado', price: 23000 },
      { id: 'bms3', name: 'Matcha Lezat', price: 29000 },
    ],
  },
  {
    id: 2,
    name: 'Boba Segar Megamall (dari Server)',
    position: [1.4800, 124.8400],
    menu: [
      { id: 'bsm1', name: 'Klasik Milk Tea Boba', price: 20000 },
      { id: 'bsm2', name: 'Smoothie Boba Buah Naga', price: 27000 },
      { id: 'bsm3', name: 'Teh Hijau Lemon Boba', price: 22000 },
    ],
  },
  {
    id: 3,
    name: 'Waroeng Boba Paal Dua (dari Server)',
    position: [1.4600, 124.8500],
    menu: [
      { id: 'wbp1', name: 'Kopi Susu Boba', price: 24000 },
      { id: 'wbp2', name: 'Strawberry Cheesecake Boba', price: 28000 },
      { id: 'wbp3', name: 'Avocado Boba Cream', price: 27000 },
    ],
  },
];
// Variabel untuk membantu generate ID unik sederhana untuk toko baru
let nextShopId = bobaShops.length > 0 ? Math.max(...bobaShops.map(s => s.id)) + 1 : 1;


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
  newOrder.status = newOrder.status || "tertunda"; // Default ke 'tertunda' jika frontend menggunakan 'pending'

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
    shops: bobaShops,
  });
});

// POST /api/shops (MEMBUAT toko boba baru)
app.post('/api/shops', (req, res) => {
  const { name, position, menu } = req.body;

  // Validasi dasar
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap atau tidak valid (nama dan posisi [lat, lng] dibutuhkan).' });
  }
  if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ message: 'Data menu tidak valid (harus berupa array).' });
  }
  // Validasi lebih lanjut untuk setiap item menu
  for (const item of menu) {
      if (!item.id || typeof item.id !== 'string' || !item.name || typeof item.name !== 'string' || typeof item.price !== 'number') {
          return res.status(400).json({ message: 'Setiap item menu harus memiliki id (string), name (string), dan price (number).' });
      }
  }


  const newShop = {
    id: nextShopId++, // Gunakan ID yang unik dan increment
    name,
    position,
    menu: menu || [], // Default ke array kosong jika menu tidak disediakan
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  bobaShops.push(newShop);
  console.log('Toko Boba Baru Ditambahkan:', newShop);
  res.status(201).json({
    message: 'Toko boba berhasil ditambahkan!',
    shopData: newShop,
  });
});

// PUT /api/shops/:shopId (MENGUPDATE toko boba yang ada)
app.put('/api/shops/:shopId', (req, res) => {
  const shopId = parseInt(req.params.shopId); // ID dari URL adalah string, ubah ke integer
  const { name, position, menu } = req.body;

  // Validasi dasar
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap atau tidak valid (nama dan posisi [lat, lng] dibutuhkan).' });
  }
   if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ message: 'Data menu tidak valid (harus berupa array).' });
  }
  // Validasi lebih lanjut untuk setiap item menu
  for (const item of menu) {
      if (!item.id || typeof item.id !== 'string' || !item.name || typeof item.name !== 'string' || typeof item.price !== 'number') {
          return res.status(400).json({ message: 'Setiap item menu harus memiliki id (string), name (string), dan price (number).' });
      }
  }

  const shopIndex = bobaShops.findIndex(shop => shop.id === shopId);

  if (shopIndex === -1) {
    return res.status(404).json({ message: `Toko dengan ID ${shopId} tidak ditemukan.` });
  }

  // Update data toko
  bobaShops[shopIndex] = {
    ...bobaShops[shopIndex], // Pertahankan ID asli dan createdAt
    name,
    position,
    menu,
    lastUpdatedAt: new Date().toISOString(),
  };

  console.log(`Data toko ID ${shopId} diupdate menjadi:`, bobaShops[shopIndex]);
  res.status(200).json({
    message: `Data toko ID ${shopId} berhasil diupdate.`,
    updatedShop: bobaShops[shopIndex],
  });
});

// DELETE /api/shops/:shopId (MENGHAPUS toko boba)
app.delete('/api/shops/:shopId', (req, res) => {
    const shopId = parseInt(req.params.shopId);
    const shopIndex = bobaShops.findIndex(shop => shop.id === shopId);

    if (shopIndex === -1) {
        return res.status(404).json({ message: `Toko dengan ID ${shopId} tidak ditemukan.` });
    }

    const deletedShop = bobaShops.splice(shopIndex, 1); // Hapus toko dari array
    console.log(`Toko Boba Dihapus:`, deletedShop[0]);
    res.status(200).json({
        message: `Toko boba dengan ID ${shopId} berhasil dihapus.`,
        deletedShop: deletedShop[0]
    });
});


app.get('/', (req, res) => {
  res.send('Selamat datang di Boba Order API! Server berjalan dengan baik.');
});

app.listen(PORT, () => {
  console.log(`Server backend Boba berjalan di http://localhost:${PORT}`);
  console.log(`---- ENDPOINTS PESANAN ----`);
  console.log(`POST   /api/orders`);
  console.log(`GET    /api/orders`);
  console.log(`PATCH  /api/orders/:orderId/status`);
  console.log(`---- ENDPOINTS TOKO ----`);
  console.log(`GET    /api/shops`);
  console.log(`POST   /api/shops`);
  console.log(`PUT    /api/shops/:shopId`);
  console.log(`DELETE /api/shops/:shopId`);
});
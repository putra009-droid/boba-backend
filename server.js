// boba-backend/server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors()); // Izinkan semua origin untuk pengembangan, bisa diperketat di produksi
app.use(express.json()); // Untuk parsing body JSON

let orders = []; // "Database" In-Memory untuk pesanan

// "Database" In-Memory untuk Toko Boba
let bobaShops = [
  {
    id: 1,
    name: 'Boba Enak Manado Town Square (Contoh)',
    position: [1.4705, 124.8370],
    whatsappNumber: '6281200000001', // TAMBAHKAN/UPDATE INI
    menu: [
      { id: 'bms1', name: 'Coklat Boba Spesial', price: 26000 },
      { id: 'bms2', name: 'Teh Susu Manado', price: 23000 },
      { id: 'bms3', name: 'Matcha Lezat', price: 29000 },
    ],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Boba Segar Megamall (Contoh)',
    position: [1.4800, 124.8400],
    whatsappNumber: '6281200000002', // TAMBAHKAN/UPDATE INI
    menu: [
      { id: 'bsm1', name: 'Klasik Milk Tea Boba', price: 20000 },
      { id: 'bsm2', name: 'Smoothie Boba Buah Naga', price: 27000 },
    ],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  },
];
let nextShopId = bobaShops.length > 0 ? Math.max(...bobaShops.map(s => parseInt(s.id))) + 1 : 1;

// Daftar status pesanan yang mungkin
const POSSIBLE_STATUSES = [
    "tertunda", "dikonfirmasi", "sedang_diproses",
    "siap_diambil", "selesai", "dibatalkan"
];

// --- KREDENSIAL ADMIN (SANGAT SEDERHANA - GANTI DI PRODUKSI!) ---
const ADMIN_USERNAME = process.env.ADMIN_USER || "adminboba";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "bobaMantap123!"; // GANTI DENGAN PASSWORD KUAT!

// --- API Endpoint untuk ADMIN LOGIN ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Admin login attempt: user='${username}'`);
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log(`Admin login successful: user='${username}'`);
        res.status(200).json({
            success: true,
            message: 'Login berhasil!',
            // token: 'contoh_token_jwt' // Untuk implementasi lebih lanjut
        });
    } else {
        console.log(`Admin login failed: user='${username}'`);
        res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }
});

// --- API Endpoints untuk PESANAN ---
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder || !newOrder.orderId || !newOrder.items || newOrder.items.length === 0) {
    return res.status(400).json({ message: 'Data pesanan tidak lengkap atau tidak valid.' });
  }
  newOrder.receivedAt = new Date().toISOString();
  newOrder.status = newOrder.status || "tertunda";
  orders.push(newOrder);
  console.log('Pesanan Baru Diterima:', newOrder.orderId, newOrder.status);
  res.status(201).json({ message: 'Pesanan berhasil diterima oleh server!', orderData: newOrder });
});

app.get('/api/orders', (req, res) => {
  res.status(200).json({ message: 'Daftar pesanan berhasil diambil.', count: orders.length, orders: orders });
});

app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status: newStatus } = req.body;
  if (!newStatus || !POSSIBLE_STATUSES.includes(newStatus)) {
    return res.status(400).json({ message: `Status tidak valid. Status yang diizinkan: ${POSSIBLE_STATUSES.join(', ')}` });
  }
  const orderIndex = orders.findIndex(order => order.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ message: `Pesanan dengan ID ${orderId} tidak ditemukan.` });
  }
  orders[orderIndex].status = newStatus;
  orders[orderIndex].lastUpdatedAt = new Date().toISOString();
  console.log(`Status pesanan ${orderId} diupdate menjadi: ${newStatus}`);
  res.status(200).json({ message: `Status pesanan ${orderId} berhasil diupdate.`, updatedOrder: orders[orderIndex] });
});

// --- API Endpoints untuk TOKO BOBA ---
app.get('/api/shops', (req, res) => {
  res.status(200).json({ message: 'Daftar toko boba berhasil diambil dari server.', shops: bobaShops });
});

app.post('/api/shops', (req, res) => {
  const { name, position, menu, whatsappNumber } = req.body; // Ambil whatsappNumber
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap (nama, posisi [lat,lng] dibutuhkan).' });
  }
  if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ message: 'Data menu tidak valid (harus array).' });
  }
  for (const item of menu) {
      if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim() || typeof item.price !== 'number' || isNaN(item.price)) {
          return res.status(400).json({ message: 'Setiap item menu harus punya id(string non-kosong), name(string non-kosong), dan price(number).' });
      }
  }
  const newShop = {
    id: nextShopId++,
    name,
    position,
    whatsappNumber: whatsappNumber || null, // Simpan nomor WA
    menu: menu || [],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  bobaShops.push(newShop);
  console.log('Toko Boba Baru Ditambahkan:', newShop);
  res.status(201).json({ message: 'Toko boba berhasil ditambahkan!', shopData: newShop });
});

app.put('/api/shops/:shopId', (req, res) => {
  const shopId = parseInt(req.params.shopId);
  const { name, position, menu, whatsappNumber } = req.body; // Ambil whatsappNumber
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap (nama, posisi [lat,lng] dibutuhkan).' });
  }
   if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ message: 'Data menu tidak valid (harus array).' });
  }
  for (const item of menu) {
      if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim() || typeof item.price !== 'number' || isNaN(item.price)) {
          return res.status(400).json({ message: 'Setiap item menu harus punya id(string non-kosong), name(string non-kosong), dan price(number).' });
      }
  }
  const shopIndex = bobaShops.findIndex(shop => shop.id === shopId);
  if (shopIndex === -1) {
    return res.status(404).json({ message: `Toko dengan ID ${shopId} tidak ditemukan.` });
  }
  bobaShops[shopIndex] = {
      ...bobaShops[shopIndex],
      name,
      position,
      whatsappNumber: whatsappNumber || null, // Update nomor WA
      menu,
      lastUpdatedAt: new Date().toISOString()
    };
  console.log(`Data toko ID ${shopId} diupdate menjadi:`, bobaShops[shopIndex]);
  res.status(200).json({ message: `Data toko ID ${shopId} berhasil diupdate.`, updatedShop: bobaShops[shopIndex] });
});

app.delete('/api/shops/:shopId', (req, res) => {
    const shopId = parseInt(req.params.shopId);
    const shopIndex = bobaShops.findIndex(shop => shop.id === shopId);
    if (shopIndex === -1) {
        return res.status(404).json({ message: `Toko dengan ID ${shopId} tidak ditemukan.` });
    }
    const deletedShop = bobaShops.splice(shopIndex, 1);
    console.log(`Toko Boba Dihapus:`, deletedShop[0]);
    res.status(200).json({ message: `Toko boba dengan ID ${shopId} berhasil dihapus.`, deletedShop: deletedShop[0] });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Selamat datang di Boba Order API! Server berjalan dengan baik.');
});

app.listen(PORT, () => {
  console.log(`Server backend Boba berjalan di http://localhost:${PORT}`);
  console.log(`Kredensial Admin (CONTOH): User=${ADMIN_USERNAME}, Pass=${ADMIN_PASSWORD}`); // HAPUS INI DI PRODUKSI
  console.log(`---- ENDPOINTS ----`);
  console.log(`POST   /api/admin/login`);
  console.log(`POST   /api/orders`);
  console.log(`GET    /api/orders`);
  console.log(`PATCH  /api/orders/:orderId/status`);
  console.log(`GET    /api/shops`);
  console.log(`POST   /api/shops`);
  console.log(`PUT    /api/shops/:shopId`);
  console.log(`DELETE /api/shops/:shopId`);
});
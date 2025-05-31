// boba-backend/server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002; // Menggunakan process.env.PORT jika ada, atau 3002

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
    whatsappNumber: '6281200000001', // Pastikan format ini sesuai dengan yang Anda inginkan
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
    whatsappNumber: '6281200000002', // Pastikan format ini sesuai dengan yang Anda inginkan
    menu: [
      { id: 'bsm1', name: 'Klasik Milk Tea Boba', price: 20000 },
      { id: 'bsm2', name: 'Smoothie Boba Buah Naga', price: 27000 },
    ],
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  },
  { // Contoh toko ketiga dari data Anda sebelumnya
    id: 3,
    name: "Toko ternate baru",
    position: [1.5043466, 124.8795891],
    whatsappNumber: "081244094589",
    menu: [],
    createdAt: "2025-05-31T08:14:20.594Z", // Sesuaikan tanggal jika perlu
    lastUpdatedAt: "2025-05-31T08:14:20.594Z" // Sesuaikan tanggal jika perlu
  }
];
// Penyesuaian untuk nextShopId jika ada penambahan manual pada bobaShops
let nextShopId = bobaShops.length > 0 ? Math.max(...bobaShops.map(s => parseInt(s.id))) + 1 : 1;


// Daftar status pesanan yang mungkin
const POSSIBLE_STATUSES = [
    "tertunda", "dikonfirmasi", "sedang_diproses",
    "siap_diambil", "selesai", "dibatalkan"
];

// --- KREDENSIAL ADMIN (SANGAT SEDERHANA - GANTI DI PRODUKSI!) ---
const ADMIN_USERNAME = process.env.ADMIN_USER || "adminboba";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "bobaMantap123!";

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
  const newOrderData = req.body; // newOrderData akan berisi semua field dari frontend, termasuk customerPhoneNumber

  // Validasi dasar
  if (!newOrderData || !newOrderData.orderId || !newOrderData.items || newOrderData.items.length === 0) {
    return res.status(400).json({ message: 'Data pesanan tidak lengkap atau tidak valid.' });
  }

  // Membuat objek pesanan yang akan disimpan
  const orderToStore = {
    ...newOrderData, // Menyalin semua field dari payload
    customerPhoneNumber: newOrderData.customerPhoneNumber || null, // Pastikan ada, atau null jika tidak dikirim
    receivedAt: new Date().toISOString(),
    status: newOrderData.status || "tertunda", // Default status jika tidak ada
    lastUpdatedAt: new Date().toISOString() // Tambahkan lastUpdatedAt saat pesanan dibuat
  };
  
  orders.push(orderToStore);
  console.log(
    'Pesanan Baru Diterima:', 
    orderToStore.orderId, 
    'Status:', orderToStore.status, 
    'No HP Pelanggan:', orderToStore.customerPhoneNumber || 'Tidak ada' // Log nomor HP pelanggan
  );
  res.status(201).json({ message: 'Pesanan berhasil diterima oleh server!', orderData: orderToStore });
});

app.get('/api/orders', (req, res) => {
  // Mengurutkan pesanan dari yang terbaru berdasarkan receivedAt
  const sortedOrders = [...orders].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  res.status(200).json({ message: 'Daftar pesanan berhasil diambil.', count: sortedOrders.length, orders: sortedOrders });
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
  orders[orderIndex].lastUpdatedAt = new Date().toISOString(); // Update timestamp
  console.log(`Status pesanan ${orderId} diupdate menjadi: ${newStatus}`);
  res.status(200).json({ message: `Status pesanan ${orderId} berhasil diupdate.`, updatedOrder: orders[orderIndex] });
});

// --- API Endpoints untuk TOKO BOBA ---
app.get('/api/shops', (req, res) => {
  res.status(200).json({ message: 'Daftar toko boba berhasil diambil dari server.', shops: bobaShops });
});

app.post('/api/shops', (req, res) => {
  const { name, position, menu, whatsappNumber } = req.body;
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap (nama, posisi [lat,lng] dibutuhkan).' });
  }
  if (menu && !Array.isArray(menu)) { // Menu bisa jadi array kosong, tapi jika ada harus array
      return res.status(400).json({ message: 'Data menu tidak valid (harus array jika ada).' });
  }
  if (menu) { // Validasi item menu jika menu ada
      for (const item of menu) {
          if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim() || typeof item.price !== 'number' || isNaN(item.price)) {
              return res.status(400).json({ message: 'Setiap item menu harus punya id(string non-kosong), name(string non-kosong), dan price(number).' });
          }
      }
  }

  const newShop = {
    id: nextShopId++,
    name,
    position,
    whatsappNumber: whatsappNumber || null,
    menu: menu || [], // Default ke array kosong jika menu tidak disediakan
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  bobaShops.push(newShop);
  console.log('Toko Boba Baru Ditambahkan:', newShop);
  res.status(201).json({ message: 'Toko boba berhasil ditambahkan!', shopData: newShop });
});

app.put('/api/shops/:shopId', (req, res) => {
  const shopId = parseInt(req.params.shopId);
  const { name, position, menu, whatsappNumber } = req.body;
  if (!name || !position || !Array.isArray(position) || position.length !== 2) {
    return res.status(400).json({ message: 'Data toko tidak lengkap (nama, posisi [lat,lng] dibutuhkan).' });
  }
  if (menu && !Array.isArray(menu)) { // Menu bisa jadi array kosong, tapi jika ada harus array
      return res.status(400).json({ message: 'Data menu tidak valid (harus array jika ada).' });
  }
  if (menu) { // Validasi item menu jika menu ada
    for (const item of menu) {
        if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim() || typeof item.price !== 'number' || isNaN(item.price)) {
            return res.status(400).json({ message: 'Setiap item menu harus punya id(string non-kosong), name(string non-kosong), dan price(number).' });
        }
    }
  }

  const shopIndex = bobaShops.findIndex(shop => shop.id === shopId);
  if (shopIndex === -1) {
    return res.status(404).json({ message: `Toko dengan ID ${shopId} tidak ditemukan.` });
  }

  bobaShops[shopIndex] = {
      ...bobaShops[shopIndex], // Pertahankan field yang tidak diupdate seperti createdAt
      name,
      position,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : bobaShops[shopIndex].whatsappNumber, // Update jika ada, jika tidak pertahankan yang lama
      menu: menu || bobaShops[shopIndex].menu, // Update jika ada, jika tidak pertahankan yang lama
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
  console.log(`Kredensial Admin (CONTOH): User=${ADMIN_USERNAME}, Pass=${ADMIN_PASSWORD}`);
  console.log(`---- ENDPOINTS ----`);
  console.log(`POST   /api/admin/login`);
  console.log(`POST   /api/orders`);
  console.log(`GET    /api/orders`);
  console.log(`PATCH  /api/orders/:orderId/status`);
  console.log(`GET    /api/shops`);
  console.log(`POST   /api/shops`);
  console.log(`PUT    /api/shops/:shopId`);
  console.log(`DELETE /api/shops/:shopId`);
  console.log(`-------------------`);
  console.log(`Database Toko Awal:`, JSON.stringify(bobaShops, null, 2));
});
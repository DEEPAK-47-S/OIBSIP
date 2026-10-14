const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');

const app = express();
app.use(cors());
app.use(express.json());

// In a real app, these would be in .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/pizza-app';
const JWT_SECRET = 'supersecretjwtkey';
const RZP_KEY_ID = 'rzp_test_YourTestKeyId';
const RZP_KEY_SECRET = 'YourTestKeySecret';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// --- MODELS ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
});
const User = mongoose.model('User', userSchema);

const inventorySchema = new mongoose.Schema({
  itemType: { type: String, required: true }, // base, sauce, cheese, veggie
  name: { type: String, required: true },
  stock: { type: Number, default: 100 },
  threshold: { type: Number, default: 20 },
});
const Inventory = mongoose.model('Inventory', inventorySchema);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pizza: {
    base: String,
    sauce: String,
    cheese: String,
    veggies: [String]
  },
  status: { type: String, enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'], default: 'Order Received' },
  paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid
  razorpayOrderId: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access only' });
  next();
};

// --- ROUTES ---

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ msg: 'Registered successfully. Please login.' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
    const payload = { id: user.id, role: user.role };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role, email: user.email });
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    // Simulate sending email
    res.json({ msg: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 2. Inventory Routes
app.get('/api/inventory', async (req, res) => {
  const inventory = await Inventory.find();
  res.json(inventory);
});

app.put('/api/inventory/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { stock } = req.body;
  const item = await Inventory.findByIdAndUpdate(req.params.id, { stock }, { new: true });
  res.json(item);
});

// Seed basic inventory (Run once)
app.post('/api/inventory/seed', async (req, res) => {
  const items = [
    { itemType: 'base', name: 'Thin Crust' },
    { itemType: 'base', name: 'Thick Crust' },
    { itemType: 'sauce', name: 'Tomato' },
    { itemType: 'cheese', name: 'Mozzarella' },
    { itemType: 'veggie', name: 'Olives' }
  ];
  await Inventory.insertMany(items);
  res.json({ msg: 'Inventory seeded' });
});

// 3. Order Routes
const razorpay = new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET });

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { base, sauce, cheese, veggies } = req.body;
    
    // Create Razorpay order
    const options = { amount: 50000, currency: "INR", receipt: "order_rcptid_11" }; // 500 INR
    const rzpOrder = await razorpay.orders.create(options);

    const newOrder = new Order({
      user: req.user.id,
      pizza: { base, sauce, cheese, veggies },
      razorpayOrderId: rzpOrder.id
    });
    await newOrder.save();
    
    // Decrement stock (basic implementation)
    await Inventory.updateOne({ name: base }, { $inc: { stock: -1 } });
    await Inventory.updateOne({ name: sauce }, { $inc: { stock: -1 } });
    await Inventory.updateOne({ name: cheese }, { $inc: { stock: -1 } });
    for (let veg of veggies) {
      await Inventory.updateOne({ name: veg }, { $inc: { stock: -1 } });
    }

    res.json(newOrder);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/orders/verify', authMiddleware, async (req, res) => {
  const { orderId, paymentId } = req.body;
  // In a real app, verify signature here using crypto
  await Order.findOneAndUpdate({ razorpayOrderId: orderId }, { paymentStatus: 'Paid' });
  res.json({ msg: 'Payment verified successfully' });
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    const orders = await Order.find().populate('user', 'email').sort('-createdAt');
    return res.json(orders);
  } else {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
    return res.json(orders);
  }
});

app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(order);
});

// --- CRON JOBS ---
// Run every hour to check inventory
cron.schedule('0 * * * *', async () => {
  try {
    const lowStockItems = await Inventory.find({ $expr: { $lt: ["$stock", "$threshold"] } });
    if (lowStockItems.length > 0) {
      console.log('Low stock detected:', lowStockItems.map(i => i.name));
      // In a real app, use nodemailer here
      /*
      let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: '...', pass: '...' } });
      await transporter.sendMail({ from: '...', to: 'admin@pizza.com', subject: 'Low Stock Alert', text: 'Stock is low!' });
      */
    }
  } catch (err) {
    console.error('Cron Error', err);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

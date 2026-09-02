const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;
const JWT_SECRET = 'change-this-secret-key';

app.use(cors());
app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let usersCollection;
let itemsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('generic_crud_db');
    usersCollection = db.collection('users');
    itemsCollection = db.collection('items');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

connectDB();

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
};

const authorizeRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to access this resource.' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const userRole = ['admin', 'user'].includes(role) ? role : 'user';

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const savedUser = {
      userId: result.insertedId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
    const token = generateToken({ _id: result.insertedId, ...savedUser });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: savedUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error creating user.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error during login.' });
  }
});

app.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Error fetching user details.' });
  }
});

app.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    const formattedUsers = users.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Error fetching users.' });
  }
});

app.get('/items', authenticateToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.userId };
    const items = await itemsCollection.find(filter).sort({ createdAt: -1 }).toArray();

    return res.json({
      items: items.map((item) => ({
        _id: item._id,
        title: item.title,
        description: item.description,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get items error:', error);
    return res.status(500).json({ message: 'Error fetching items.' });
  }
});

app.post('/items', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const item = {
      title: title.trim(),
      description: description.trim(),
      createdBy: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await itemsCollection.insertOne(item);

    return res.status(201).json({
      message: 'Item created successfully.',
      item: { _id: result.insertedId, ...item },
    });
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({ message: 'Error creating item.' });
  }
});

app.put('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const itemId = req.params.id;

    const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (req.user.role !== 'admin' && item.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own items.' });
    }

    const updatedItem = {
      title: title ? title.trim() : item.title,
      description: description ? description.trim() : item.description,
      updatedAt: new Date(),
    };

    await itemsCollection.updateOne({ _id: new ObjectId(itemId) }, { $set: updatedItem });

    return res.json({
      message: 'Item updated successfully.',
      item: { _id: itemId, ...item, ...updatedItem },
    });
  } catch (error) {
    console.error('Update item error:', error);
    return res.status(500).json({ message: 'Error updating item.' });
  }
});

app.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await itemsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (req.user.role !== 'admin' && item.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own items.' });
    }

    await itemsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    return res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({ message: 'Error deleting item.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let loginCollection, employeeCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("database-mongo");
        loginCollection = db.collection("login");
        employeeCollection = db.collection("employees");
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err);
    }
}
connectDB();

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

// Routes
app.get('/', (req, res) => {
    res.send('Hello from Express server with JWT!');
});

// Register route (renamed from signup)
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, emp_code, role } = req.body;

        if (!username || !email || !password || !emp_code || !role) {
            return res.status(400).json({ message: "All fields are required: username, email, password, emp_code, role" });
        }

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role must be either 'user' or 'admin'" });
        }

        // Check if user already exists
        const existingUser = await loginCollection.findOne({
            $or: [{ username }, { email }, { emp_code }]
        });

        if (existingUser) {
            return res.status(409).json({ message: "Username, email, or employee code already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            emp_code,
            role,
            created_at: new Date()
        };

        const result = await loginCollection.insertOne(newUser);

        res.status(201).json({
            message: "User registered successfully",
            userId: result.insertedId,
            emp_code: emp_code,
            role: role
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating user" });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await loginCollection.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                emp_code: user.emp_code
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token: token,
            role: user.role,
            emp_code: user.emp_code
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Logout route
app.post('/logout', authenticateToken, (req, res) => {
    // In a real application, you might want to blacklist the token
    res.json({ message: "Logout successful" });
});

// Employee CRUD routes

// GET - Get all employees (accessible by both user and admin)
app.get('/employees', authenticateToken, authorizeRole(['user', 'admin']), async (req, res) => {
    try {
        const employees = await employeeCollection.find({}).toArray();
        res.json({ employees });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching employees" });
    }
});

// GET - Get employee by ID (accessible by both user and admin)
app.get('/employees/:id', authenticateToken, authorizeRole(['user', 'admin']), async (req, res) => {
    try {
        const employee = await employeeCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.json({ employee });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching employee" });
    }
});

// POST - Create new employee (admin only)
app.post('/employees', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { emp_code, name, department, position, salary, email, phone } = req.body;

        if (!emp_code || !name || !department || !position) {
            return res.status(400).json({ message: "Required fields: emp_code, name, department, position" });
        }

        // Check if employee code already exists
        const existingEmployee = await employeeCollection.findOne({ emp_code });
        if (existingEmployee) {
            return res.status(409).json({ message: "Employee code already exists" });
        }

        const newEmployee = {
            emp_code,
            name,
            department,
            position,
            salary,
            email,
            phone,
            created_at: new Date(),
            created_by: req.user.emp_code
        };

        const result = await employeeCollection.insertOne(newEmployee);
        res.status(201).json({
            message: "Employee created successfully",
            employeeId: result.insertedId,
            employee: newEmployee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating employee" });
    }
});

// PUT - Update employee (admin only)
app.put('/employees/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { name, department, position, salary, email, phone } = req.body;

        const updateData = {
            ...(name && { name }),
            ...(department && { department }),
            ...(position && { position }),
            ...(salary && { salary }),
            ...(email && { email }),
            ...(phone && { phone }),
            updated_at: new Date(),
            updated_by: req.user.emp_code
        };

        const result = await employeeCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating employee" });
    }
});

// DELETE - Delete employee (admin only)
app.delete('/employees/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const result = await employeeCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting employee" });
    }
});

// User management routes (admin only)

// GET - Get all users (admin only)
app.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const users = await loginCollection.find({}, { projection: { password: 0 } }).toArray();
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching users" });
    }
});

// PUT - Update user role (admin only)
app.put('/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role must be either 'user' or 'admin'" });
        }

        const result = await loginCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { role, updated_at: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User role updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating user" });
    }
});

// DELETE - Delete user (admin only)
app.delete('/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const result = await loginCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting user" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
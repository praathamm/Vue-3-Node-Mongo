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

let loginCollection, employeeCollection, onboardingCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("database-mongo");
        loginCollection = db.collection("login");
        employeeCollection = db.collection("employees");
        onboardingCollection = db.collection("onboarding");
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

// REGISTER ROUTE
app.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({
                message: "All fields are required: name, email, phone, password, role"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Phone number must be 10 digits" });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // Validate role - updated to match requirements
        if (!['HR', 'Employee'].includes(role)) {
            return res.status(400).json({ message: "Role must be either 'HR' or 'Employee'" });
        }

        // Check if user already exists
        const existingUser = await loginCollection.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            let conflictField = '';
            if (existingUser.email === email) conflictField = 'Email';
            else if (existingUser.phone === phone) conflictField = 'Phone number';

            return res.status(409).json({
                message: `${conflictField} already exists. Please use different credentials.`
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            created_at: new Date(),
            updated_at: new Date(),
            is_active: true,
            onBoardingComplete: false
        };

        const result = await loginCollection.insertOne(newUser);

        // Return user data without password
        res.status(201).json({
            message: "User registered successfully",
            user: {
                userId: result.insertedId,
                name: name,
                email: email,
                phone: phone,
                role: role,
                created_at: newUser.created_at
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: "Error creating user. Please try again later." });
    }
});

// UPDATED LOGIN ROUTE
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await loginCollection.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({ message: "Account is deactivated. Please contact admin." });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                emp_code: user.emp_code,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                emp_code: user.emp_code,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: "Error during login. Please try again later." });
    }
});

// UPDATED LOGOUT ROUTE
app.post('/logout', authenticateToken, (req, res) => {
    // In a production app, you'd want to add the token to a blacklist
    res.status(200).json({ message: "Logged out successfully" });
});

// DASHBOARD ROUTE
app.get('/getemployees', authenticateToken, async (req, res) => {
    try {
        // Get employees with onBoarding status false
        const employeesNotOnboarded = await loginCollection.find({
            role: 'Employee',
            $or: [
                { onBoardingComplete: false },
                { onBoardingComplete: { $exists: false } }
            ]
        }, {
            projection: { password: 0 } // Exclude password from response
        }).toArray();

        // Get employees with onBoarding status true
        const employeesOnboarded = await loginCollection.find({
            role: 'Employee',
            onBoardingComplete: true
        }, {
            projection: { password: 0 }
        }).toArray();

        // Get HR with onBoarding status false
        const hrNotOnboarded = await loginCollection.find({
            role: 'HR',
            $or: [
                { onBoardingComplete: false },
                { onBoardingComplete: { $exists: false } }
            ]
        }, {
            projection: { password: 0 }
        }).toArray();

        // Get HR with onBoarding status true
        const hrOnboarded = await loginCollection.find({
            role: 'HR',
            onBoardingComplete: true
        }, {
            projection: { password: 0 }
        }).toArray();

        res.status(200).json({
            message: "Employees data fetched successfully",
            data: {
                employeesNotOnboarded,
                employeesOnboarded,
                hrNotOnboarded,
                hrOnboarded
            }
        });
    } catch (err) {
        console.error('Get employees error:', err);
        res.status(500).json({ message: "Error fetching employees data" });
    }
});

// NEW ONBOARD ROUTE (HR Only)
app.post('/onboard', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { _id, name, email, phone, role, created_at, updated_at, is_active } = req.body;

        // Validate required fields
        if (!_id || !name || !email || !role) {
            return res.status(400).json({
                message: "Required fields are missing: _id, name, email, role"
            });
        }

        // Ensure role is Employee
        if (role !== 'Employee') {
            return res.status(400).json({ message: "Only Employee role can be onboarded" });
        }

        // Check if employee exists in loginCollection
        const employee = await loginCollection.findOne({
            _id: new ObjectId(_id),
            role: 'Employee'
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found or invalid role" });
        }

        // Check if already onboarded
        const existingOnboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(_id)
        });
        if (existingOnboarding) {
            return res.status(409).json({ message: "Employee is already onboarded" });
        }

        // Build onboarding document
        const onboardingData = {
            employeeId: new ObjectId(_id),
            addedBy: new ObjectId(req.user.userId),
            department: employee.department || "Not Assigned",
            designation: employee.designation || "Not Assigned",
            joiningDate: employee.joiningDate ? new Date(employee.joiningDate) : null,
            employeeCode: employee.emp_code || "Not Assigned", // Use emp_code from login record
            status: "pending",
            tasks: [
                { taskName: "Complete company policy acknowledgment", isCompleted: false, completedAt: null },
                { taskName: "Attend orientation session", isCompleted: false, completedAt: null },
                { taskName: "Update required document links (ID proof, bank details, etc.)", isCompleted: false, completedAt: null }
            ],
            documents: [
                { docType: "ID Proof URL", fileUrl: "", uploadedAt: null, mandatory: true },
                { docType: "PAN/Aadhar URL", fileUrl: "", uploadedAt: null, mandatory: false },
                { docType: "Bank Account Details URL", fileUrl: "", uploadedAt: null, mandatory: false },
                { docType: "Offer Letter Acceptance URL", fileUrl: "", uploadedAt: null, mandatory: true }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await onboardingCollection.insertOne(onboardingData);

        // Update the user's status in the login collection to reflect the start of onboarding
        await loginCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { onBoardingComplete: true, updatedAt: new Date() } }
        );

        res.status(201).json({
            message: "Employee onboarded successfully",
            onboardingId: result.insertedId,
            employee: {
                name,
                email,
                phone,
                role
            }
        });
    } catch (err) {
        console.error('Onboarding error:', err);
        res.status(500).json({ message: "Error creating onboarding record" });
    }
});


// GET ALL ONBOARDING RECORDS (HR Only)
app.get('/onboarding', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const onboardingRecords = await onboardingCollection.aggregate([
            {
                $lookup: {
                    from: "login",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employeeInfo"
                }
            },
            {
                $lookup: {
                    from: "login",
                    localField: "addedBy",
                    foreignField: "_id",
                    as: "hrInfo"
                }
            },
            {
                $project: {
                    department: 1,
                    designation: 1,
                    joiningDate: 1,
                    employeeCode: 1,
                    status: 1,
                    tasks: 1,
                    documents: 1,
                    createdAt: 1,
                    "employeeInfo.name": 1,
                    "employeeInfo.email": 1,
                    "hrInfo.name": 1
                }
            }
        ]).toArray();

        res.status(200).json({
            message: "Onboarding records fetched successfully",
            records: onboardingRecords
        });
    } catch (err) {
        console.error('Error fetching onboarding records:', err);
        res.status(500).json({ message: "Error fetching onboarding records" });
    }
});

// GET MY ONBOARDING (Employee Only)
app.get('/my-onboarding', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
    try {
        const onboardingRecord = await onboardingCollection.findOne({
            employeeId: new ObjectId(req.user.userId)
        });

        if (!onboardingRecord) {
            return res.status(404).json({ message: "Onboarding record not found" });
        }

        res.status(200).json({
            message: "Onboarding record fetched successfully",
            record: onboardingRecord
        });
    } catch (err) {
        console.error('Error fetching onboarding record:', err);
        res.status(500).json({ message: "Error fetching onboarding record" });
    }
});

// NEW: Add/Update Onboarding Details (HR Only)
app.put('/onboard/details/:employeeId', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { department, designation, joiningDate, employeeCode } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required in the URL" });
        }

        // Construct the update object dynamically to allow partial updates
        const updateData = {};
        if (department) updateData.department = department;
        if (designation) updateData.designation = designation;
        if (joiningDate) updateData.joiningDate = new Date(joiningDate);
        if (employeeCode) updateData.employeeCode = employeeCode;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "At least one field to update is required (department, designation, joiningDate, or employeeCode)" });
        }

        // Also update the 'updatedAt' timestamp
        updateData.updatedAt = new Date();

        const result = await onboardingCollection.updateOne(
            { employeeId: new ObjectId(employeeId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Onboarding record not found for the given employee" });
        }

        res.status(200).json({
            message: "Onboarding details updated successfully"
        });

    } catch (err) {
        console.error('Update onboarding details error:', err);
        res.status(500).json({ message: "Error updating onboarding details" });
    }
});

// Employee CRUD routes (keeping existing functionality)

// GET - Get all employees (accessible by both Employee and HR)
app.get('/employees', authenticateToken, authorizeRole(['Employee', 'HR']), async (req, res) => {
    try {
        const employees = await employeeCollection.find({}).toArray();
        res.json({ employees });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching employees" });
    }
});

// GET - Get employee by ID (accessible by both Employee and HR)
app.get('/employees/:id', authenticateToken, authorizeRole(['Employee', 'HR']), async (req, res) => {
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

// POST - Create new employee (HR only)
app.post('/employees', authenticateToken, authorizeRole(['HR']), async (req, res) => {
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

// PUT - Update employee (HR only)
app.put('/employees/:id', authenticateToken, authorizeRole(['HR']), async (req, res) => {
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

// DELETE - Delete employee (HR only)
app.delete('/employees/:id', authenticateToken, authorizeRole(['HR']), async (req, res) => {
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

// User management routes (HR only)

// GET - Get all users (HR only)
app.get('/users', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const users = await loginCollection.find({}, { projection: { password: 0 } }).toArray();
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching users" });
    }
});

// PUT - Update user details (HR only)
app.put('/users/:id', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { role, department, designation, joiningDate, emp_code } = req.body;
        const updateData = {};

        if (role) {
            if (!['Employee', 'HR'].includes(role)) {
                return res.status(400).json({ message: "Role must be either 'Employee' or 'HR'" });
            }
            updateData.role = role;
        }

        if (department) updateData.department = department;
        if (designation) updateData.designation = designation;
        if (joiningDate) updateData.joiningDate = new Date(joiningDate);
        if (emp_code) updateData.emp_code = emp_code;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields to update were provided." });
        }

        updateData.updated_at = new Date();

        const result = await loginCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User details updated successfully",
            updatedFields: updateData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating user" });
    }
});

// DELETE - Delete user (HR only)
app.delete('/users/:id', authenticateToken, authorizeRole(['HR']), async (req, res) => {
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

// Updated APIs with document name storage

// 1. Complete Company Policy Acknowledgment
app.put('/onboard/task/policy-acknowledgment', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId),
            status: "pending"
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found or already completed" });
        }

        const result = await onboardingCollection.updateOne(
            {
                employeeId: new ObjectId(employeeId),
                "tasks.taskName": "Complete company policy acknowledgment"
            },
            {
                $set: {
                    "tasks.$.isCompleted": true,
                    "tasks.$.completedAt": new Date(),
                    "updatedAt": new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Task not found or already completed" });
        }

        res.status(200).json({
            message: "Company policy acknowledgment completed successfully",
            completedAt: new Date()
        });

    } catch (err) {
        console.error('Policy acknowledgment error:', err);
        res.status(500).json({ message: "Error updating policy acknowledgment" });
    }
});

// 2. Complete Orientation Session
app.put('/onboard/task/orientation', authenticateToken, authorizeRole(['Employee', 'HR']), async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId),
            status: "pending"
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found or already completed" });
        }

        const result = await onboardingCollection.updateOne(
            {
                employeeId: new ObjectId(employeeId),
                "tasks.taskName": "Attend orientation session"
            },
            {
                $set: {
                    "tasks.$.isCompleted": true,
                    "tasks.$.completedAt": new Date(),
                    "updatedAt": new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Task not found or already completed" });
        }

        res.status(200).json({
            message: "Orientation session marked as completed",
            completedAt: new Date()
        });

    } catch (err) {
        console.error('Orientation completion error:', err);
        res.status(500).json({ message: "Error updating orientation session" });
    }
});

// 3. Complete Document Links Update Task
app.put('/onboard/task/documents', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId),
            status: "pending"
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found or already completed" });
        }

        const result = await onboardingCollection.updateOne(
            {
                employeeId: new ObjectId(employeeId),
                "tasks.taskName": "Update required document links (ID proof, bank details, etc.)"
            },
            {
                $set: {
                    "tasks.$.isCompleted": true,
                    "tasks.$.completedAt": new Date(),
                    "updatedAt": new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Task not found or already completed" });
        }

        res.status(200).json({
            message: "Document links update task completed successfully",
            completedAt: new Date()
        });

    } catch (err) {
        console.error('Document task completion error:', err);
        res.status(500).json({ message: "Error updating document task" });
    }
});

// 4. Upload Multiple Documents (ID Proof, PAN/Aadhar, Bank Details) - UPDATED
app.put('/onboard/documents/upload', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
    try {
        const { employeeId, documents } = req.body;

        if (!employeeId || !documents || !Array.isArray(documents)) {
            return res.status(400).json({
                message: "employeeId and documents array are required"
            });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId),
            status: "pending"
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found or already completed" });
        }

        const validDocTypes = ["ID Proof URL", "PAN/Aadhar URL", "Bank Account Details URL"];
        const updateOperations = [];

        for (const doc of documents) {
            if (!doc.docType || !doc.fileUrl || !doc.fileName) {
                return res.status(400).json({
                    message: "Each document must have docType, fileUrl, and fileName"
                });
            }

            if (!validDocTypes.includes(doc.docType)) {
                return res.status(400).json({
                    message: `Invalid document type: ${doc.docType}. Valid types are: ${validDocTypes.join(', ')}`
                });
            }

            updateOperations.push({
                updateOne: {
                    filter: {
                        employeeId: new ObjectId(employeeId),
                        "documents.docType": doc.docType
                    },
                    update: {
                        $set: {
                            "documents.$.fileUrl": doc.fileUrl,
                            "documents.$.fileName": doc.fileName,
                            "documents.$.uploadedAt": new Date(),
                            "updatedAt": new Date()
                        }
                    }
                }
            });
        }

        const results = await onboardingCollection.bulkWrite(updateOperations);

        if (results.modifiedCount === 0) {
            return res.status(400).json({ message: "No documents were updated" });
        }

        res.status(200).json({
            message: "Documents uploaded successfully",
            updatedCount: results.modifiedCount,
            uploadedAt: new Date()
        });

    } catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ message: "Error uploading documents" });
    }
});

// 5. Upload Offer Letter Acceptance (Final Step) - UPDATED
app.put('/onboard/offer-letter/upload', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
    try {
        const { employeeId, fileUrl, fileName } = req.body;

        if (!employeeId || !fileUrl || !fileName) {
            return res.status(400).json({ message: "employeeId, fileUrl, and fileName are required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId),
            status: "pending"
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found or already completed" });
        }

        const result = await onboardingCollection.updateOne(
            {
                employeeId: new ObjectId(employeeId),
                "documents.docType": "Offer Letter Acceptance URL"
            },
            {
                $set: {
                    "documents.$.fileUrl": fileUrl,
                    "documents.$.fileName": fileName,
                    "documents.$.uploadedAt": new Date(),
                    "updatedAt": new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Offer letter document not found" });
        }

        // Check if onboarding is complete
        const updatedOnboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId)
        });

        const allTasksCompleted = updatedOnboarding.tasks.every(task => task.isCompleted);
        const mandatoryDocs = updatedOnboarding.documents.filter(doc => doc.mandatory);
        const allMandatoryDocsUploaded = mandatoryDocs.every(doc => doc.fileUrl && doc.fileUrl.trim() !== "");

        if (allTasksCompleted && allMandatoryDocsUploaded) {
            await onboardingCollection.updateOne(
                { employeeId: new ObjectId(employeeId) },
                {
                    $set: {
                        status: "completed",
                        updatedAt: new Date()
                    }
                }
            );

            res.status(200).json({
                message: "Offer letter uploaded successfully! Onboarding process completed.",
                status: "completed",
                uploadedAt: new Date()
            });
        } else {
            res.status(200).json({
                message: "Offer letter uploaded successfully",
                status: "pending",
                uploadedAt: new Date(),
                note: "Complete remaining tasks and upload mandatory documents to finish onboarding"
            });
        }

    } catch (err) {
        console.error('Offer letter upload error:', err);
        res.status(500).json({ message: "Error uploading offer letter" });
    }
});

// Get Onboarding Status API - UPDATED
app.get('/onboard/status/:employeeId', authenticateToken, authorizeRole(['Employee', 'HR']), async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId)
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found" });
        }

        const completedTasks = onboarding.tasks.filter(task => task.isCompleted).length;
        const totalTasks = onboarding.tasks.length;
        const uploadedMandatoryDocs = onboarding.documents
            .filter(doc => doc.mandatory && doc.fileUrl && doc.fileUrl.trim() !== "").length;
        const totalMandatoryDocs = onboarding.documents.filter(doc => doc.mandatory).length;

        const taskCompletionRate = (completedTasks / totalTasks) * 100;
        const docCompletionRate = (uploadedMandatoryDocs / totalMandatoryDocs) * 100;
        const overallCompletionRate = (taskCompletionRate + docCompletionRate) / 2;

        res.status(200).json({
            employeeId: onboarding.employeeId,
            employeeCode: onboarding.employeeCode,
            status: onboarding.status,
            department: onboarding.department,
            designation: onboarding.designation,
            joiningDate: onboarding.joiningDate,
            documentsVerified: onboarding.documentsVerified || false, // Add this field
            progress: {
                overallCompletion: Math.round(overallCompletionRate),
                tasksCompleted: `${completedTasks}/${totalTasks}`,
                mandatoryDocsUploaded: `${uploadedMandatoryDocs}/${totalMandatoryDocs}`
            },
            tasks: onboarding.tasks,
            documents: onboarding.documents,
            createdAt: onboarding.createdAt,
            updatedAt: onboarding.updatedAt
        });

    } catch (err) {
        console.error('Get onboarding status error:', err);
        res.status(500).json({ message: "Error fetching onboarding status" });
    }
});

app.get('/onboard/dashboard/stats', authenticateToken, authorizeRole(['HR', 'Admin']), async (req, res) => {
    try {
        // Fetch all onboarding records
        const allOnboardingRecords = await onboardingCollection.find({}).toArray();

        const totalEmployees = allOnboardingRecords.length;
        let completedOnboarding = 0;
        let pendingOnboarding = 0;
        let documentsVerified = 0;
        let documentsPending = 0;

        // Process each onboarding record
        allOnboardingRecords.forEach(record => {
            // Count completed vs pending onboarding based on status
            if (record.status === 'completed') {
                completedOnboarding++;
            } else {
                pendingOnboarding++;
            }

            // Check if all mandatory documents are uploaded
            const mandatoryDocs = record.documents.filter(doc => doc.mandatory);
            const uploadedMandatoryDocs = mandatoryDocs.filter(doc =>
                doc.fileUrl &&
                doc.fileUrl.trim() !== "" &&
                doc.uploadedAt !== null
            );

            // If all mandatory documents are uploaded, count as verified
            if (mandatoryDocs.length > 0 && uploadedMandatoryDocs.length === mandatoryDocs.length) {
                documentsVerified++;
            } else {
                documentsPending++;
            }
        });

        // Calculate percentages
        const completionRate = totalEmployees > 0 ? Math.round((completedOnboarding / totalEmployees) * 100) : 0;
        const documentVerificationRate = totalEmployees > 0 ? Math.round((documentsVerified / totalEmployees) * 100) : 0;

        // Detailed breakdown by department and status
        const departmentStats = {};
        const statusBreakdown = {
            completed: [],
            pending: [],
            documentsVerified: [],
            documentsPending: []
        };

        allOnboardingRecords.forEach(record => {
            const dept = record.department || 'Unassigned';

            // Department statistics
            if (!departmentStats[dept]) {
                departmentStats[dept] = {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    documentsVerified: 0,
                    documentsPending: 0
                };
            }

            departmentStats[dept].total++;

            if (record.status === 'completed') {
                departmentStats[dept].completed++;
            } else {
                departmentStats[dept].pending++;
            }

            // Check document verification for department stats
            const mandatoryDocs = record.documents.filter(doc => doc.mandatory);
            const uploadedMandatoryDocs = mandatoryDocs.filter(doc =>
                doc.fileUrl &&
                doc.fileUrl.trim() !== "" &&
                doc.uploadedAt !== null
            );

            if (mandatoryDocs.length > 0 && uploadedMandatoryDocs.length === mandatoryDocs.length) {
                departmentStats[dept].documentsVerified++;
                statusBreakdown.documentsVerified.push({
                    employeeId: record.employeeId,
                    employeeCode: record.employeeCode,
                    department: record.department,
                    designation: record.designation
                });
            } else {
                departmentStats[dept].documentsPending++;
                statusBreakdown.documentsPending.push({
                    employeeId: record.employeeId,
                    employeeCode: record.employeeCode,
                    department: record.department,
                    designation: record.designation,
                    missingDocs: mandatoryDocs.filter(doc =>
                        !doc.fileUrl ||
                        doc.fileUrl.trim() === "" ||
                        doc.uploadedAt === null
                    ).map(doc => doc.docType)
                });
            }

            // Add to status breakdown
            if (record.status === 'completed') {
                statusBreakdown.completed.push({
                    employeeId: record.employeeId,
                    employeeCode: record.employeeCode,
                    department: record.department,
                    designation: record.designation,
                    completedAt: record.updatedAt
                });
            } else {
                statusBreakdown.pending.push({
                    employeeId: record.employeeId,
                    employeeCode: record.employeeCode,
                    department: record.department,
                    designation: record.designation,
                    joiningDate: record.joiningDate
                });
            }
        });

        // Response
        res.status(200).json({
            summary: {
                totalEmployees,
                completedOnboarding,
                pendingOnboarding,
                documentsVerified,
                documentsPending,
                completionRate: `${completionRate}%`,
                documentVerificationRate: `${documentVerificationRate}%`
            },
            departmentWiseStats: departmentStats,
            detailedBreakdown: {
                employeesWithCompletedOnboarding: statusBreakdown.completed,
                employeesWithPendingOnboarding: statusBreakdown.pending,
                employeesWithVerifiedDocuments: statusBreakdown.documentsVerified,
                employeesWithPendingDocuments: statusBreakdown.documentsPending
            },
            metadata: {
                generatedAt: new Date(),
                totalRecordsProcessed: totalEmployees
            }
        });

    } catch (err) {
        console.error('Get onboarding dashboard stats error:', err);
        res.status(500).json({
            message: "Error fetching onboarding dashboard statistics",
            error: err.message
        });
    }
});

// GET route to fetch employees with verified documents
app.get('/verified-employees', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const verifiedEmployees = await onboardingCollection.aggregate([
            // Step 1: Filter for records where documents are verified
            {
                $match: { documentsVerified: true }
            },
            // Step 2: Join with the login collection to get employee details
            {
                $lookup: {
                    from: "login",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employeeInfo"
                }
            },
            // Step 3: Deconstruct the employeeInfo array
            {
                $unwind: "$employeeInfo"
            },
            // Step 4: Project only the required fields
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    name: "$employeeInfo.name",
                    email: "$employeeInfo.email"
                }
            }
        ]).toArray();

        res.status(200).json({
            message: "Successfully fetched employees with verified documents.",
            data: verifiedEmployees
        });
    } catch (err) {
        console.error('Error fetching verified employees:', err);
        res.status(500).json({ message: "Error fetching verified employees" });
    }
});

// GET route to fetch employee documents for verification
app.get('/onboard/documents/verify/:employeeId', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId)
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found" });
        }

        // Check if employee has completed onboarding
        if (onboarding.status !== 'completed') {
            return res.status(400).json({
                message: "Employee has not completed the onboarding process",
                canVerify: false,
                status: onboarding.status
            });
        }

        // Format documents for verification
        const documentsForVerification = onboarding.documents
            .filter(doc => doc.fileUrl && doc.fileUrl.trim() !== "") // Only include documents that have been uploaded
            .map(doc => ({
                docType: doc.docType,
                fileUrl: doc.fileUrl,
                fileName: doc.fileName || 'N/A',
                uploadedAt: doc.uploadedAt,
                mandatory: doc.mandatory,
                displayText: `${doc.docType} - ${doc.fileUrl}`,
                verified: doc.verified || false // Include existing verification status if any
            }));

        // Check if no documents are uploaded
        if (documentsForVerification.length === 0) {
            return res.status(400).json({
                message: "No documents have been uploaded by the employee",
                canVerify: false
            });
        }

        // Calculate verification status
        const totalDocs = documentsForVerification.length;
        const verifiedDocs = documentsForVerification.filter(doc => doc.verified === true).length;
        const isFullyVerified = onboarding.documentsVerified === true;

        res.status(200).json({
            employeeId: onboarding.employeeId,
            employeeCode: onboarding.employeeCode,
            department: onboarding.department,
            designation: onboarding.designation,
            canVerify: true,
            documentsForVerification,
            verificationSummary: {
                totalDocuments: totalDocs,
                verifiedDocuments: verifiedDocs,
                isFullyVerified: isFullyVerified,
                verificationStatus: isFullyVerified ? 'All Documents Verified' : 'Pending Verification'
            },
            message: "Documents ready for verification"
        });

    } catch (err) {
        console.error('Get documents for verification error:', err);
        res.status(500).json({ message: "Error fetching documents for verification" });
    }
});

// PUT route to update document verification status
app.put('/onboard/documents/verify/:employeeId', authenticateToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { documentsVerification } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        if (!documentsVerification || !Array.isArray(documentsVerification) || documentsVerification.length === 0) {
            return res.status(400).json({
                message: "documentsVerification array is required and must contain document verification data"
            });
        }

        const onboarding = await onboardingCollection.findOne({
            employeeId: new ObjectId(employeeId)
        });

        if (!onboarding) {
            return res.status(404).json({ message: "Onboarding record not found" });
        }

        // Check if employee has completed onboarding
        if (onboarding.status !== 'completed') {
            return res.status(400).json({
                message: "Employee has not completed the onboarding process. Cannot verify documents.",
                status: onboarding.status
            });
        }

        // Validate the verification data format
        for (const verificationItem of documentsVerification) {
            if (!verificationItem.docType || !verificationItem.fileUrl || !verificationItem.verificationStatus) {
                return res.status(400).json({
                    message: "Each document verification must include docType, fileUrl, and verificationStatus (verified/not verified)"
                });
            }

            if (!['verified', 'not verified'].includes(verificationItem.verificationStatus.toLowerCase())) {
                return res.status(400).json({
                    message: "verificationStatus must be either 'verified' or 'not verified'"
                });
            }
        }

        // Update documents with verification status
        const updatedDocuments = onboarding.documents.map(doc => {
            // Find matching verification data
            const verificationData = documentsVerification.find(v =>
                v.docType === doc.docType && v.fileUrl === doc.fileUrl
            );

            if (verificationData) {
                return {
                    ...doc,
                    verified: verificationData.verificationStatus.toLowerCase() === 'verified',
                    verifiedAt: verificationData.verificationStatus.toLowerCase() === 'verified' ? new Date() : null,
                    verificationComments: verificationData.comments || null
                };
            }

            return doc; // Return unchanged if no verification data found
        });

        // Check if all uploaded documents are verified
        const uploadedDocs = updatedDocuments.filter(doc => doc.fileUrl && doc.fileUrl.trim() !== "");
        const allUploadedsVerified = uploadedDocs.length > 0 && uploadedDocs.every(doc => doc.verified === true);

        // Prepare update data
        const updateData = {
            documents: updatedDocuments,
            documentsVerified: allUploadedsVerified,
            updatedAt: new Date()
        };

        // If all documents are verified, add verification timestamp
        if (allUploadedsVerified) {
            updateData.documentsVerifiedAt = new Date();
            updateData.documentsVerifiedBy = req.user.userId; // Assuming you have user info in req.user from auth middleware
        }

        const result = await onboardingCollection.updateOne(
            { employeeId: new ObjectId(employeeId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Failed to update onboarding record" });
        }

        // Prepare response summary
        const verifiedCount = uploadedDocs.filter(doc => doc.verified === true).length;
        const totalUploadedCount = uploadedDocs.length;

        res.status(200).json({
            message: "Document verification updated successfully",
            employeeId: employeeId,
            verificationSummary: {
                totalDocuments: totalUploadedCount,
                verifiedDocuments: verifiedCount,
                pendingDocuments: totalUploadedCount - verifiedCount,
                allDocumentsVerified: allUploadedsVerified,
                verificationCompleted: allUploadedsVerified,
                verificationDate: allUploadedsVerified ? new Date() : null
            },
            documentsStatus: uploadedDocs.map(doc => ({
                docType: doc.docType,
                fileName: doc.fileName || doc.fileUrl,
                verified: doc.verified || false,
                verifiedAt: doc.verifiedAt || null
            }))
        });

    } catch (err) {
        console.error('Update document verification error:', err);
        res.status(500).json({ message: "Error updating document verification" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();
const axios = require('axios');
const multer = require('multer');
const session = require('express-session');

const app = express();
const port = 3000;

// Multer memory storage for file uploads
const upload = multer();

// === Database Connection ===
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'USER'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL Database');
});

// === Middleware ===
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

app.use(session({
    secret: 'your_secret_key_here', // change this secret to a strong one
    resave: false,
    saveUninitialized: true
}));

// === In-Memory OTP Store (temporary) ===
const otpMemory = {};

// === Signup Route ===
app.post('/submit-form', async (req, res) => {
    const { fullName, phoneNumber, email, password } = req.body;
    if (!fullName || !phoneNumber || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO user_info (full_name, phone_number, email, password) VALUES (?, ?, ?, ?)';
        db.query(query, [fullName.trim(), phoneNumber.trim(), email.trim(), hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    const message = err.sqlMessage.includes('email')
                        ? 'Email address already exists.'
                        : 'Phone number already exists.';
                    return res.status(409).json({ message });
                }
                console.error('❌ Database error on signup:', err);
                return res.status(500).json({ message: 'Signup failed, please try again later.' });
            }
            res.status(200).json({ message: 'Signup successful!' });
        });
    } catch (error) {
        console.error('❌ Password hashing error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// === Login Route ===
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM user_info WHERE email = ?";
    db.query(query, [email.trim()], async (err, results) => {
        if (err) {
            console.error("❌ SQL query error during login:", err);
            return res.status(500).json({ message: "Server error during login." });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Email not found." });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password." });
        }
        // Store user info in session
        req.session.user = { id: user.id, email: user.email };
        res.status(200).json({ message: "Login successful!" });
    });
});

// === Forgot Password Route (send OTP via Python) ===
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpMemory[email] = { otp, expiry: Date.now() + 10 * 60 * 1000 };

    const emailDomain = email.split('@')[1];
    const query = 'SELECT smtp_server, smtp_port, sender_email, sender_password FROM smtp_config WHERE domain = ?';

    db.query(query, [emailDomain], (err, results) => {
        if (err) {
            console.error('❌ SMTP DB error:', err);
            return res.status(500).json({ message: 'SMTP DB error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: `No SMTP config for domain: ${emailDomain}` });
        }

        const smtp = results[0];
        const scriptPath = path.join(__dirname, 'send_otp.py');
        const args = [
            scriptPath,
            smtp.smtp_server.trim(),
            smtp.smtp_port,
            smtp.sender_email.trim(),
            smtp.sender_password.trim(),
            email.trim(),
            otp.trim()
        ];

        const pythonProcess = spawn('python', args);

        pythonProcess.on('error', (err) => {
            console.error('Python Error:', err.message);
        });

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Output: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python exited with code ${code}`);
                return res.status(500).json({ message: 'OTP send failed' });
            } else {
                res.json({ message: 'OTP sent successfully.' });
            }
        });
    });
});

// === Reset Password Route ===
app.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const stored = otpMemory[email];
    if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
        return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE user_info SET password = ? WHERE email = ?';
        db.query(query, [hashedPassword, email.trim()], (err, results) => {
            if (err) {
                console.error('❌ Update password error:', err);
                return res.status(500).json({ message: 'Update failed' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Email not found.' });
            }
            delete otpMemory[email];
            res.status(200).json({ message: 'Password updated successfully!' });
        });
    } catch (err) {
        console.error('❌ Hashing error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// === Logout Route ===
app.post("/logout", (req, res) => {
  // If using express-session
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout." });
    }

    res.clearCookie("connect.sid"); // default cookie name for express-session
    return res.status(200).json({ message: "Logged out successfully." });
  });
});
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 3600000 // 1 hour
  }
}));

// === Identify Plant Route ===
app.post('/identify-plant', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    axios.post('http://localhost:5000/predict', { image: base64Image })
        .then(response => res.json(response.data))
        .catch(error => {
            console.error('❌ Flask communication error:', error.message);
            res.status(500).json({ error: 'Could not upload image or get prediction' });
        });
});
// === Admin Login Route ===
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const query = "SELECT * FROM admin WHERE username = ?";

    db.query(query, [username.trim()], (err, results) => {
        if (err) {
            console.error("❌ SQL query error during admin login:", err);
            return res.status(500).json({ message: "Server error during admin login." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Admin username not found." });
        }

        const admin = results[0];
        // Plain text password check:
        if (password !== admin.password) {
            return res.status(401).json({ message: "Incorrect admin password." });
        }

        req.session.admin = {
            id: admin.id,
            username: admin.username
        };

        res.status(200).json({ message: "Admin login successful!" });
    });
});

// === User Profile Route ===
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in first.' });
    }

    const userId = req.session.user.id;
    const query = 'SELECT full_name, email, phone_number FROM user_info WHERE id = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching profile:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(results[0]); // Send user profile as JSON
    });
});
app.get('/admin/stats', (req, res) => {
  // Optionally check if admin is logged in
  if (!req.session.admin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userCountQuery = 'SELECT COUNT(*) AS totalUsers FROM user_info';

  db.query(userCountQuery, (err, results) => {
    if (err) {
      console.error('Error fetching total users:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    const totalUsers = results[0].totalUsers;

    res.json({
      admin: req.session.admin.username,
      totalUsers
    });
  });
});

// edit profile route thru admin//
app.get('/admin/users', (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const query = 'SELECT id, full_name, phone_number, email FROM user_info';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});
// delete user route thru admin//
app.delete('/admin/users/:id', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ message: 'Unauthorized' });

  const query = 'DELETE FROM user_info WHERE id = ?';
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});
// update user info route thru admin//
app.put('/admin/users/:id', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ message: 'Unauthorized' });

  const { full_name, phone_number, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'UPDATE user_info SET full_name=?, phone_number=?, email=?, password=? WHERE id=?';

    db.query(query, [full_name, phone_number, email, hashedPassword, req.params.id], (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json({ message: 'User updated successfully' });
    });
  } catch (err) {
    console.error('Hashing error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/update-profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in first.' });
  }

  const userId = req.session.user.id;
  const { full_name, email, phone_number, password } = req.body;

  try {
    const updateFields = [];
    const values = [];

    // Dynamically build query
    if (full_name) {
      updateFields.push("full_name = ?");
      values.push(full_name);
    }
    if (email) {
      updateFields.push("email = ?");
      values.push(email);
    }
    if (phone_number) {
      updateFields.push("phone_number = ?");
      values.push(phone_number);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No data to update.' });
    }

    const query = `UPDATE user_info SET ${updateFields.join(', ')} WHERE id = ?`;
    values.push(userId);

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('❌ Profile update error:', err);
        return res.status(500).json({ message: 'Failed to update profile.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.status(200).json({ message: 'Profile updated successfully!' });
    });
  } catch (error) {
    console.error('❌ Error during update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// === Start Server ===
app.listen(port, () => {
    console.log(`🚀 Server running at: http://localhost:${port}`);
});

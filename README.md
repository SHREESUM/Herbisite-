# 🌿 HerbiSite – Medicinal Plant Identification
Identify Medicinal Plant Using ML

**HerbiSite** is a demo web application that uses **Machine Learning (ML)** to identify medicinal plants from uploaded images and receive predictions. It integrates a Python-based ML model with a Node.js backend and uses MySQL for data storage. Users can register, log in.

---

## 🚀 Features

- 🌱 Upload image of a plant to get medicinal identification
- 🔐 User registration & login with OTP-based password recovery
- 🧠 Flask-powered ML backend for real-time image prediction
- 🗄️ Data stored and managed in MySQL Workbench
- 🎨 Clean UI built with HTML, CSS, and JavaScript
- 📩 Email verification using Python and Gmail SMTP

---

## ⚙️ Tech Stack

| Technology       | Purpose                        |
|------------------|--------------------------------|
| **HTML/CSS/JS**  | Frontend                       |
| **Node.js**      | Backend Server (Express)       |
| **Python**       | Email OTP system               |
| **Flask**        | ML prediction server           |
| **MySQL**        | Database (MySQL Workbench)     |
| **Multer**       | Image upload handling          |
| **Axios/Fetch**  | Client-server communication    |

---

## 🗂️ Project Structure

herbisite/
├── public/                      # Frontend and ML-related files
│   ├── index.html               # Homepage (example)
│   ├── app.py                   # Flask ML API
│   ├── model/                   # Pretrained ML model files
│   └── ...                      # Other frontend assets (CSS, JS, etc.)
├── server.js                    # Node.js backend server
├── sendotp.py                   # Python script for sending OTP emails
├── uploads/                     # Uploaded image storage
├── database/                    # SQL files or DB connection config
└── README.md                    # Project documentation

---

## 📦 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/herbisite.git
cd herbisite
2. Install Node.js Dependencies
npm install
3. Install Python & Flask Requirements
cd public
pip install -r requirements.txt
python app.py

4. Setup MySQL Database
Open MySQL Workbench

Create a database (e.g. herbisite_db)

Import the SQL schema
File name is database.sql

5. Configure .env (create one in root)
env
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=yourpassword
DB_HOST=localhost
DB_USER=root
DB_PASS=your_db_password
DB_NAME=herbisite_db

6. Start Flask ML Server
bash
cd public
python app.py

7. Start Node.js Server
open another terminal 
node server.js

8. Open in Browser
http://localhost:3000/


🧪 Example Use Case
User signs up and verifies email using OTP.

Uploads an image of a plant.

Flask server returns plant name, medicinal use, and details.

User receives feedback and can leave a review.

📸 Screenshots

1. Index page 
<img width="1917" height="965" alt="image" src="https://github.com/user-attachments/assets/1af91ca4-afbb-4d11-b2d0-e8ea3a184ca6" />

2. Uploading Image
<img width="1825" height="960" alt="image" src="https://github.com/user-attachments/assets/e984aefa-2ee6-40cd-a88c-350113ace701" />

3. ML Predicted Image
<img width="1409" height="856" alt="image" src="https://github.com/user-attachments/assets/ca0cd9aa-dd69-4bcb-b759-24e0c2f2ed5f" />

🛠️ Future Enhancements
🔬 Expand dataset for more accurate predictions

🌐 Deploy to cloud (Render, Railway, or VPS)

🧪 Add AR/VR module for interactive learning

📱 Build mobile-friendly PWA

🙌 Credits
Project by [Shreesum Manandhar]
Used Node.js, Python, and Machine Learning

create database USER; 
Drop database USER;
USE USER;

CREATE TABLE user_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
ALTER USER 'root'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY 'root';
FLUSH PRIVILEGES;
USE USER;
SELECT * FROM user_info;
DELETE FROM user_info WHERE id= 9;
ALTER TABLE user_info ADD COLUMN otp VARCHAR(10), ADD COLUMN otp_expiry DATETIME;

CREATE TABLE IF NOT EXISTS smtp_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    smtp_server VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_password VARCHAR(255) NOT NULL
);

SELECT * FROM smtp_config;

-- Insert sample SMTP configurations for common email domains
INSERT IGNORE INTO smtp_config (domain, smtp_server, smtp_port, sender_email, sender_password)
VALUES
('gmail.com', 'smtp.gmail.com', 587, 'shreesumm@gmail.com', 'ncxa uxom qtcm eugn'),
('yahoo.com', 'smtp.mail.yahoo.com', 587, 'your_yahoo@yahoo.com', 'your_yahoo_password'),
('outlook.com', 'smtp.office365.com', 587, 'your_outlook@outlook.com', 'your_outlook_password');


-- Update Gmail credentials with a valid App Password
UPDATE smtp_config
SET sender_password = 'ncxa uxom qtcm eugn'
WHERE domain = 'shreesumm@gmail.com';

-- Update Yahoo credentials (if applicable)
UPDATE smtp_config
SET sender_password = 'your_valid_yahoo_password'
WHERE domain = 'yahoo.com';

-- Update Outlook credentials (if applicable)
UPDATE smtp_config
SET sender_password = 'your_valid_outlook_password'
WHERE domain = 'outlook.com';

DROP TABLE user_info;

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
INSERT INTO admin (username, password) 
VALUES ('admin', 'admin123');

drop table admin;








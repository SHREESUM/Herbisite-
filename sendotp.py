# send_otp.py

import sys
import random
import smtplib
from email.mime.text import MIMEText

# Get email from command line
if len(sys.argv) < 2:
    print("Error: No email address provided.")
    sys.exit(1)

email = sys.argv[1]
otp = str(random.randint(100000, 999999))

# Prepare the email content
message = MIMEText(f"Your OTP for password reset is: {otp}")
message["Subject"] = "Password Reset OTP"
message["From"] = "your_email@gmail.com"
message["To"] = email

# Send the email
try:
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("your_email@gmail.com", "your_app_password")
        server.send_message(message)
except Exception as e:
    print(f"Error sending email: {e}")
    sys.exit(1)

# Print OTP so Node.js can read it
print(otp)

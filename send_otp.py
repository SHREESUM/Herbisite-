import sys
import smtplib
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def generate_otp():
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))

def send_email(smtp_server, smtp_port, sender_email, sender_password, recipient_email, otp):
    subject = "Your OTP Code"
    
    # HTML version of the email body
    body_html = f"""
    <html>
        <body>
            <h2>Your OTP Code</h2>
            <p>Your OTP code is: <strong>{otp}</strong></p>
            <p>Please use this code to reset your password. The code is valid for 10 minutes.</p>
            <p>Thank you,<br>Medicinal Herb Detection Team</p>
        </body>
    </html>
    """
    
    # Plain text version of the email body
    body_text = f"""
    Your OTP Code

    Your OTP code is: {otp}

    Please use this code to reset your password. The code is valid for 10 minutes.

    Thank you,
    Medicinal Herb Detection Team
    """
    
    # Prepare the email message with both plain text and HTML versions
    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient_email

    # Attach both the plain text and HTML versions of the message
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        print(f"Connecting to SMTP server: {smtp_server}:{smtp_port}")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Start TLS encryption for security
            print("Starting TLS encryption...")

            server.login(sender_email, sender_password)  # Login using the provided sender email and password
            print(f"Logged in as {sender_email}")
            
            # Send the email to the recipient
            server.sendmail(sender_email, recipient_email, msg.as_string())
            print(f"Email sent successfully to {recipient_email}")

    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {e.smtp_code} - {e.smtp_error.decode()}", file=sys.stderr)
    except smtplib.SMTPConnectError as e:
        print(f"SMTP Connection Error: {e}", file=sys.stderr)
    except smtplib.SMTPException as e:
        print(f"SMTP Error: {e}", file=sys.stderr)
    except Exception as e:
        print(f"Unexpected Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    # Ensure we are getting the required number of arguments
    if len(sys.argv) != 7:
        print("Usage: python send_otp.py <smtp_server> <smtp_port> <sender_email> <sender_password> <recipient_email> <otp>", file=sys.stderr)
        sys.exit(1)

    # Get arguments passed from the Node.js application
    smtp_server = sys.argv[1]
    smtp_port = int(sys.argv[2])
    sender_email = sys.argv[3]
    sender_password = "ncxa uxom qtcm eugn"  # Replace with the new App Password
    recipient_email = sys.argv[5]
    otp = sys.argv[6]

    # Log received arguments for debugging (except for sensitive data like passwords)
    print(f"Received Arguments:")
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"Sender Email: {sender_email}")
    print(f"Sender Password: {sender_password}")  # Be cautious with logging sensitive data
    print(f"Recipient Email: {recipient_email}")
    print(f"OTP: {otp}")

    # Ensure that all required fields are provided
    if not smtp_server or not smtp_port or not sender_email or not sender_password or not recipient_email or not otp:
        print("Error: Invalid SMTP details or OTP provided.", file=sys.stderr)
        sys.exit(1)

    # Send the OTP via email
    send_email(smtp_server, smtp_port, sender_email, sender_password, recipient_email, otp)

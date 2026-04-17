import os
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS   = os.getenv("EMAIL_ADDRESS", "").strip()
# Gmail App Passwords are sometimes stored with spaces (e.g. "xxxx xxxx xxxx xxxx") — strip them
EMAIL_PASSWORD  = os.getenv("EMAIL_PASSWORD", "").replace(" ", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "CareerLens")


def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))


def _build_message(to_email: str, code: str, name: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your CareerLens verification code"
    msg["From"]    = f"{EMAIL_FROM_NAME} <{EMAIL_ADDRESS}>"
    msg["To"]      = to_email

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0b0c0e;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0c0e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#131517;border:1px solid #222428;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #222428;">
              <span style="font-size:22px;font-weight:800;color:#c8f135;letter-spacing:-0.5px;">
                CareerLens
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0f0ee;">
                Verify your email address
              </h2>
              <p style="margin:0 0 28px;color:#6b6e78;font-size:15px;line-height:1.6;">
                Hi {name}, use the code below to confirm your account.
                It expires in <strong style="color:#f0f0ee;">10 minutes</strong>.
              </p>
              <div style="background:#0b0c0e;border:1px solid #2e3138;border-radius:8px;
                          padding:24px;text-align:center;margin-bottom:28px;">
                <span style="font-size:40px;font-weight:800;color:#c8f135;
                             letter-spacing:12px;font-family:monospace;">
                  {code}
                </span>
              </div>
              <p style="margin:0;color:#6b6e78;font-size:13px;line-height:1.6;">
                If you didn't create a CareerLens account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #222428;">
              <p style="margin:0;color:#6b6e78;font-size:12px;">
                &copy; 2025 CareerLens &mdash; AI-powered career platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    plain = (
        f"Hi {name},\n\n"
        f"Your CareerLens verification code is: {code}\n\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you didn't sign up, ignore this email."
    )
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def send_verification_email(to_email: str, code: str, name: str) -> bool:
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("[email_service] EMAIL_ADDRESS or EMAIL_PASSWORD not set in .env")
        return False

    msg = _build_message(to_email, code, name)

    # Try port 587 (STARTTLS) first — most ISPs allow this
    # Fall back to port 465 (SSL) if 587 fails
    errors = []

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
        print(f"[email_service] Email sent via port 587 to {to_email}")
        return True
    except Exception as e:
        errors.append(f"port 587: {e}")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
        print(f"[email_service] Email sent via port 465 to {to_email}")
        return True
    except Exception as e:
        errors.append(f"port 465: {e}")

    print(f"[email_service] All SMTP attempts failed: {'; '.join(errors)}")
    return False

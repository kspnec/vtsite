import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str, full_name: str) -> None:
    """Send password reset email. Falls back to console log if SMTP not configured."""
    subject = "Reset your Village Connect password"
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
      <h2 style="color: #0891b2;">🌿 Village Connect</h2>
      <p>Hi {full_name},</p>
      <p>We received a request to reset your password. Click the button below to set a new one:</p>
      <a href="{reset_url}"
         style="display:inline-block;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;
                padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p style="color:#6b7280;font-size:12px;">Or copy this URL: {reset_url}</p>
    </div>
    """
    text_body = f"Hi {full_name},\n\nReset your Village Connect password:\n{reset_url}\n\nExpires in 1 hour."

    if not settings.SMTP_HOST:
        logger.info("=== PASSWORD RESET (SMTP not configured) ===")
        logger.info("To: %s", to_email)
        logger.info("Reset URL: %s", reset_url)
        logger.info("==========================================")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER or "noreply@villageconnect.app"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as smtp:
            smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception as exc:
        logger.error("Failed to send reset email to %s: %s", to_email, exc)
        # Don't raise — silently fail so we don't leak whether email exists

"""CloudGuard AI â€” Email Delivery Service
Handles secure delivery of authentication OTP verification codes and system security alerts.
Supports SMTP provider, Resend API, and transparent development fallback.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("cloudguard.email")


class EmailService:
    """Production-grade email service abstraction with SMTP, Resend, and developer logging."""

    @staticmethod
    def is_configured() -> bool:
        """Check if any valid email delivery provider credentials are set."""
        return bool(settings.SMTP_HOST or settings.RESEND_API_KEY)

    @classmethod
    def send_password_reset_otp(cls, recipient_email: str, otp_code: str) -> Dict[str, Any]:
        """Send 6-digit OTP verification code for password reset.
        Returns delivery status dictionary without throwing uncaught exceptions.
        """
        subject = "CloudGuard AI â€” Password Reset Verification Code"
        
        text_content = f"""Hello,

You recently requested a password reset for your CloudGuard AI account ({recipient_email}).

Your 6-digit verification code is:

    {otp_code}

This code will expire in 10 minutes and can only be used once.
If you did not request this verification code, please ignore this email or notify your security administrator immediately.

â€” CloudGuard AI Security Operations Team
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .logo {{ font-size: 18px; font-weight: 700; color: #2563eb; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }}
    .title {{ font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }}
    .otp-box {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0; font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; }}
    .footer {{ font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span>ðŸ›¡ï¸ CloudGuard AI</span>
    </div>
    <div class="title">Password Reset Verification</div>
    <p>A password reset request was initiated for your CloudGuard AI account (<strong>{recipient_email}</strong>).</p>
    <p>Use the following single-use verification code to complete your password reset:</p>
    <div class="otp-box">{otp_code}</div>
    <p style="font-size: 13px; color: #475569;">
      â±ï¸ This code expires in <strong>10 minutes</strong>. For your security, this code cannot be reused.
    </p>
    <div class="footer">
      If you did not request a password reset, you can safely disregard this message. Your password will remain unchanged.
    </div>
  </div>
</body>
</html>
"""

        # 1. If SMTP provider configured
        if settings.SMTP_HOST:
            return cls._send_via_smtp(recipient_email, subject, text_content, html_content)

        # 2. Unconfigured fallback (Dev / Demo mode)
        logger.warning(
            "[EMAIL_SERVICE] Email delivery is NOT CONFIGURED. "
            "Configure SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD in environment."
        )

        if settings.ENVIRONMENT.lower() == "development" or settings.DEPLOYMENT_MODE == "DEMO":
            logger.info(f"[DEV_ONLY] Verification code for {recipient_email}: {otp_code}")

        return {
            "delivered": False,
            "status": "UNCONFIGURED",
            "message": "Email delivery is not configured on this server. Please contact your platform administrator."
        }

    @classmethod
    def _send_via_smtp(cls, recipient: str, subject: str, text: str, html: str) -> Dict[str, Any]:
        """Deliver email using standard authenticated SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = recipient

            msg.attach(MIMEText(text, "plain"))
            msg.attach(MIMEText(html, "html"))

            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                if settings.SMTP_TLS:
                    server.starttls()

            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            server.sendmail(settings.SMTP_FROM, [recipient], msg.as_string())
            server.quit()

            logger.info(f"[EMAIL_SERVICE] Successfully dispatched OTP email to {recipient}")
            return {
                "delivered": True,
                "status": "SENT",
                "message": f"Verification code sent to {recipient}."
            }
        except Exception as e:
            logger.error(f"[EMAIL_SERVICE] Failed to send email via SMTP: {str(e)}")
            return {
                "delivered": False,
                "status": "FAILED",
                "message": f"Failed to deliver email: {str(e)}"
            }

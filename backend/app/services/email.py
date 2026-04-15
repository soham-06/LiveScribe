import resend
from app.config import get_settings


def send_action_items_email(
    to_email: str,
    meeting_title: str,
    summary: str,
    action_items: list[dict],
) -> None:
    """
    Send an email with the meeting's action items to the user.
    Silently fails (logs error) so it never blocks the upload response.
    """
    settings = get_settings()

    if not settings.RESEND_API_KEY:
        print("[EMAIL] RESEND_API_KEY not set — skipping email.")
        return

    resend.api_key = settings.RESEND_API_KEY

    # Build the action-items HTML list
    if not action_items:
        items_html = "<p style='color:#a0a5b8;'>No action items were identified for this meeting.</p>"
    else:
        rows = ""
        for i, item in enumerate(action_items, 1):
            task = item.get("task", item) if isinstance(item, dict) else str(item)
            assignee = item.get("assignee", "") if isinstance(item, dict) else ""
            deadline = item.get("deadline", "") if isinstance(item, dict) else ""

            assignee_html = (
                f"<span style='color:#a29bfe;font-size:13px;'> — {assignee}</span>"
                if assignee else ""
            )
            deadline_html = (
                f"<span style='color:#00cec9;font-size:13px;margin-left:8px;'>📅 {deadline}</span>"
                if deadline else ""
            )

            rows += f"""
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #1e2235;font-size:14px;color:#f0f0f5;">
                <span style="color:#6c5ce7;font-weight:600;margin-right:8px;">{i}.</span>
                {task}{assignee_html}{deadline_html}
              </td>
            </tr>"""

        items_html = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          {rows}
        </table>"""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#06080f;font-family:'Inter',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#6c5ce7,#a29bfe,#00cec9);
                      padding:12px 18px;border-radius:12px;margin-bottom:16px;">
            <span style="font-size:20px;font-weight:700;color:#fff;">Livescribe</span>
          </div>
          <h1 style="color:#f0f0f5;font-size:22px;font-weight:700;margin:0 0 4px;">
            Action Items Ready
          </h1>
          <p style="color:#a0a5b8;font-size:14px;margin:0;">
            Your meeting has been processed
          </p>
        </div>

        <!-- Meeting Card -->
        <div style="background:#0c1019;border:1px solid rgba(108,92,231,0.15);border-radius:16px;
                    padding:24px;margin-bottom:24px;">
          <h2 style="color:#f0f0f5;font-size:18px;font-weight:600;margin:0 0 8px;">
            📋 {meeting_title}
          </h2>
          <p style="color:#a0a5b8;font-size:13px;line-height:1.6;margin:0;">
            {summary[:300]}{'…' if len(summary) > 300 else ''}
          </p>
        </div>

        <!-- Action Items -->
        <div style="background:#0c1019;border:1px solid rgba(108,92,231,0.15);border-radius:16px;
                    padding:24px;">
          <h3 style="color:#f0f0f5;font-size:16px;font-weight:600;margin:0 0 16px;">
            ✅ Action Items ({len(action_items)})
          </h3>
          {items_html}
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:32px;padding-top:24px;
                    border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:#636980;font-size:12px;margin:0;">
            Sent by Livescribe — AI Meeting Intelligence
          </p>
        </div>
      </div>
    </body>
    </html>"""

    try:
        resend.Emails.send({
            "from": "Livescribe <onboarding@resend.dev>",
            "to": [to_email],
            "subject": f"Action Items: {meeting_title}",
            "html": html_body,
        })
        print(f"[EMAIL] Action items sent to {to_email}")
    except Exception as e:
        # Never let email failure break the upload flow
        print(f"[EMAIL] Failed to send to {to_email}: {type(e).__name__}: {e}")

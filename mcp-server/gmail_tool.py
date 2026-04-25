import base64
from email.message import EmailMessage
from googleapiclient.discovery import build
from auth import get_creds

def create_email_draft(to, subject, body):
    creds = get_creds()
    service = build("gmail", "v1", credentials=creds)
    
    message = EmailMessage()
    message.set_content(body)
    message["To"] = to
    message["From"] = "me"
    message["Subject"] = subject

    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    create_message = {"message": {"raw": encoded_message}}
    
    draft = service.users().drafts().create(userId="me", body=create_message).execute()
    return draft["id"]

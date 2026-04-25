import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow

# The scopes required for the project
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/gmail.compose"
]

def main():
    if not os.path.exists("credentials.json"):
        print("❌ Error: credentials.json not found in this folder!")
        return

    print("📡 Starting Google Authentication Flow...")
    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    creds = flow.run_local_server(port=0)

    # Save the credentials for the next run
    with open("token.json", "w") as token:
        token.write(creds.to_json())
    
    print("\n✅ Success! token.json has been created in this folder.")
    print("🚀 You can now upload this file to Hugging Face Secrets.")

if __name__ == "__main__":
    main()

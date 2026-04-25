from googleapiclient.discovery import build
from auth import get_creds

def append_to_doc(doc_id, content):
    creds = get_creds()
    service = build("docs", "v1", credentials=creds)
    
    requests = [
        {
            "insertText": {
                "location": {"index": 1},
                "text": content + "\n\n"
            }
        }
    ]
    
    result = service.documents().batchUpdate(documentId=doc_id, body={"requests": requests}).execute()
    return result

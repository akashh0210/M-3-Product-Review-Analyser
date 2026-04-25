from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gmail_tool import create_email_draft
from docs_tool import append_to_doc

app = FastAPI()

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str

class DocRequest(BaseModel):
    doc_id: str
    content: str

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "mcp-bridge"}

@app.post("/create_email_draft")
def email_endpoint(req: EmailRequest):
    try:
        draft_id = create_email_draft(req.to, req.subject, req.body)
        return {"status": "success", "draft_id": draft_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/append_to_doc")
def doc_endpoint(req: DocRequest):
    try:
        result = append_to_doc(req.doc_id, req.content)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

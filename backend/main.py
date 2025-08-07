from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pdfplumber

app = FastAPI()

@app.post("/analyze")
async def analyze_report(file: UploadFile = File(...)):
    # Extract text from PDF
    if file.content_type == "application/pdf":
        with pdfplumber.open(file.file) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    else:
        text = (await file.read()).decode("utf-8")

    # TODO: Run your ML model here
    # For now, just return the extracted text
    result = {
        "extracted_text": text,
        "analysis": "Model output would go here"
    }
    return JSONResponse(content=result)

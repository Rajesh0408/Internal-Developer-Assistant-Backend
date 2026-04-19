from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import PyPDF2
import os

app = FastAPI(title="Retrieval API")

# Setup model and FAISS index
MODEL_NAME = 'all-MiniLM-L6-v2'
model = SentenceTransformer(MODEL_NAME)
EMBEDDING_DIM = model.get_sentence_embedding_dimension()
index = faiss.IndexFlatL2(EMBEDDING_DIM)

# In-memory store for metadata. In production, this would be a persistent vector DB like Qdrant/Milvus or Postgres+pgvector.
metadata_store = []

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

class IngestRequest(BaseModel):
    file_path: str
    filename: str
    doc_url: str

def chunk_text(text, chunk_size=200, overlap=50):
    chunks = []
    words = text.split()
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk) > 20:
            chunks.append(chunk)
    return chunks

@app.post("/ingest")
async def ingest_document(req: IngestRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")
        
    try:
        reader = PyPDF2.PdfReader(req.file_path)
        chunks_to_add = []
        meta_to_add = []
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                chunks = chunk_text(text)
                for chunk in chunks:
                    chunks_to_add.append(chunk)
                    meta_to_add.append({
                        "file": req.filename,
                        "page": i + 1,
                        "url": req.doc_url,
                        "text": chunk
                    })
        
        if chunks_to_add:
            embeddings = model.encode(chunks_to_add, convert_to_numpy=True)
            faiss.normalize_L2(embeddings)
            index.add(embeddings)
            metadata_store.extend(meta_to_add)
            
        return {"status": "success", "chunks_added": len(chunks_to_add)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrieve")
async def retrieve(req: QueryRequest):
    if index.ntotal == 0:
        return {"results": []}
        
    query_vector = model.encode([req.query], convert_to_numpy=True)
    faiss.normalize_L2(query_vector)
    
    distances, indices = index.search(query_vector, min(req.top_k, index.ntotal))
    
    results = []
    for j, idx in enumerate(indices[0]):
        if idx != -1 and idx < len(metadata_store):
            # L2 distance is smaller for more similar items since vectors are normalized.
            results.append(metadata_store[idx])
            
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

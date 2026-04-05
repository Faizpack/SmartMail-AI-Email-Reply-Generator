import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import pipeline
import torch
import warnings

warnings.filterwarnings("ignore")

app = FastAPI(title="SmartMail AI API")

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a local app, we can be permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_name = "google/flan-t5-base"
# Optional fallback to 'google/flan-t5-small' if 'base' is too heavy for the machine
generator = None

@app.on_event("startup")
def load_model():
    global generator
    print(f"Loading local AI model '{model_name}'... This may take a minute based on your internet and hardware.")
    
    device_id = -1 
    
    # Check for Apple Silicon (MPS)
    if torch.backends.mps.is_available():
        device_id = "mps"
    elif torch.cuda.is_available():
        device_id = 0
    else:

    try:
        generator = pipeline(
            "text2text-generation",
            model=model_name,
            device=device_id if device_id != -1 else None # If -1, leave device unset or handle it properly based on transformers version.
        )
        # Actually transformers pipeline device argument: 
        # `device=0` for cuda:0, `device="mps"` for mps, `device=-1` for CPU.
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")

class EmailRequest(BaseModel):
    email_text: str
    tone: str
    length: str

class ReplyResponse(BaseModel):
    intent: str
    summary: str
    replies: List[str]

@app.post("/api/generate", response_model=ReplyResponse)
async def generate_replies(req: EmailRequest):
    if generator is None:
        raise HTTPException(status_code=500, detail="AI model is not loaded.")

    if not req.email_text.strip():
        raise HTTPException(status_code=400, detail="Email text cannot be empty.")

    text = req.email_text.strip()
    
    # 1. Detect Intent
    intent_prompt = f"Categorize the following email into one of these exact intents: Request, Complaint, Meeting, Follow-up, Inquiry. Reply with only the category name.\n\nEmail: {text}\n\nIntent:"
    out_intent = generator(intent_prompt, max_new_tokens=10, do_sample=False)
    intent = out_intent[0]["generated_text"].strip() if out_intent else "Unknown"

    # 2. Summarize Email
    summary_prompt = f"Write a short, concise summary of the following email:\n\nEmail: {text}\n\nSummary:"
    out_summary = generator(summary_prompt, max_new_tokens=50, do_sample=False)
    summary = out_summary[0]["generated_text"].strip() if out_summary else "No summary available."

    # 3. Generate Replies (Using do_sample=True, num_return_sequences=3 to get diverse outputs)
    num_replies = 3
    
    length_constraint = {
        "Short": "in 1 to 2 lines",
        "Medium": "in 3 to 5 lines",
        "Detailed": "in a detailed paragraph"
    }.get(req.length, "in a few sentences")

    # We use a base prompt that specifies the tone and length completely contextually
    reply_prompt = f"Write a {req.tone.lower()} email reply {length_constraint} in response to the following email:\n\nEmail: {text}\n\nReply:"

    try:
        reply_outputs = generator(
            reply_prompt, 
            max_new_tokens=150, 
            num_return_sequences=num_replies,
            num_beams=1,
            do_sample=True,
            temperature=0.8,
            top_p=0.9,
            repetition_penalty=1.2
        )
        replies = [out["generated_text"].strip() for out in reply_outputs]
    except Exception as e:
        print(f"Error generating replies: {e}")
        # Sometimes batch generation fails on small hardware, we fallback to single generation looped
        print("Falling back to sequential generation...")
        replies = []
        try:
            for i in range(num_replies):
                out = generator(
                    reply_prompt, 
                    max_new_tokens=150, 
                    do_sample=True, 
                    temperature=0.8 + (i*0.1) # varying temp for diversity
                )
                replies.append(out[0]["generated_text"].strip())
        except Exception as e2:
            print(f"Fallback generation also failed: {e2}")
            raise HTTPException(status_code=500, detail="Failed to generate replies.")

    # basic dedup
    unique_replies = list(dict.fromkeys(replies))
    while len(unique_replies) < num_replies:
        unique_replies.append("Failed to generate a completely unique alternative. Please try adjusting the tone or length.")

    return ReplyResponse(
        intent=intent,
        summary=summary,
        replies=unique_replies
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": generator is not None}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

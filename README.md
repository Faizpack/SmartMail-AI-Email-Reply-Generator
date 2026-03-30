# SmartMail AI - Email Reply Generator

A completely **local**, full-stack web application that takes an incoming email as input and generates intelligent, context-aware reply suggestions with customizable tone and length.

Powered by FastAPI and local AI (HuggingFace `flan-t5-base`), this application works entirely autonomously without requiring remote LLM APIs, ensuring zero cost and full privacy.

## Features

- **Local AI execution**: Uses `google/flan-t5-base` via `transformers`
- **Dynamic Context**: Analyzes Intent and generates a Summary for the incoming email
- **Tone Modulation**: Adjust between Formal, Casual, Professional, Friendly, Apologetic, and Assertive tones
- **Length Constraint**: Generate short, medium, or detailed replies
- **Hardware Accelerated**: Automatically leverages Apple Silicon (MPS) or CUDA if available
- **Modern UI**: Dark/Light mode, clean interface built with Tailwind CSS via CDN
- **Easy Setup**: No Node.js build steps needed. The frontend can run on a simple python HTTP server!

---

## Output Preview

The application accurately categorizes emails, summarizes them, and drafts customized responses that you can instantly copy to your clipboard.

![App Dashboard]()

---

## System Requirements

- Python 3.8+
- ~2GB of open RAM for the `base` language model
- (Optional but Recomended) Apple Silicon Mac or NVIDIA GPU for faster generation times

---

## 🛠️ Installation & Setup

### 1. Backend Setup

The backend powers the AI capabilities using FastAPI.

1. Open a terminal and navigate to the project directory:
   ```bash
   cd smartmail-ai/backend
   ```
2. Create and activate a Python virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python3 main.py
   ```
   *Note: On your first run, the Application will download the ~1GB `flan-t5-base` model from HuggingFace to your local cache. This might take a few minutes depending on your internet connection.*

The server will be available at: **http://localhost:8000**

---

### 2. Frontend Setup

The frontend is a lightweight HTML/JS application that uses Tailwind CSS over CDN, eliminating the need for `npm` installation.

1. Open **another** terminal window and navigate to the frontend directory:
   ```bash
   cd smartmail-ai/frontend
   ```
2. Start a simple static file server using Python:
   ```bash
   python3 -m http.server 3000
   ```
3. Open your browser and navigate to: **http://localhost:3000**

---

## 🧪 Usage

Once both servers are running:
1. Copy an email from the provided `sample_emails.txt` or use your own.
2. Paste it into the "Incoming Email" box.
3. Select your desired Tone and Length.
4. Click **Generate Replies**. Wait a bit for the local model to process.
5. Review the intent, summary, and click the copy icon on any generated reply to use it!

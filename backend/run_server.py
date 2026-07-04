import os
import sys

# Ensure we're in the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

import uvicorn

if __name__ == "__main__":
    print(f"Starting PrepAgent backend...")
    print(f"Working directory: {os.getcwd()}")
    print(f"GROQ_API_KEY set: {'yes' if os.getenv('GROQ_API_KEY') else 'NO'}")
    print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'using default')}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=9001, reload=False)

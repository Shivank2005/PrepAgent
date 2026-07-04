import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.rag.retriever import retrieve_interview_experiences

async def test():
    print("Testing Pinecone Retrieval...")
    results = await retrieve_interview_experiences(company="Google")
    print(f"Found {len(results)} results.")
    for r in results:
        print(f"- {r['company']}: {r['text'][:100]}... (Score: {r['distance']})")

if __name__ == "__main__":
    asyncio.run(test())

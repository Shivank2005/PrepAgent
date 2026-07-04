from app.rag.retriever import get_collection
import json

collection = get_collection()
results = collection.get()

print('--- ChromaDB Documents ---')
print(f"Total Documents: {len(results['ids'])}\n")

for i in range(len(results['ids'])):
    print(f"[{i+1}] ID: {results['ids'][i]}")
    
    meta = results['metadatas'][i]
    company = meta.get('company', 'Unknown')
    role = meta.get('role', 'Unknown')
    topics = meta.get('topics', '[]')
    
    print(f"    Company: {company} | Role: {role}")
    print(f"    Topics: {topics}")
    print(f"    Content: {results['documents'][i]}\n")

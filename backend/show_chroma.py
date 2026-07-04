import chromadb

client = chromadb.PersistentClient(path='./chroma_db')
collections = client.list_collections()

print('--- ChromaDB Collections ---')
for col in collections:
    print(col.name)
    results = client.get_collection(col.name).get()
    print(f"Total Documents: {len(results['ids'])}\n")
    for i in range(len(results['ids'])):
        print(f"ID: {results['ids'][i]}")
        print(f"Text: {results['documents'][i][:100]}...\n")

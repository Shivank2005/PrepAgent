import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
if 'prepagent' in [i['name'] for i in pc.list_indexes()]:
    print("Deleting existing 1536d index...")
    pc.delete_index('prepagent')
    print("Deleted.")

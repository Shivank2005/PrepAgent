"""Pinecone-powered RAG retriever for interview experiences"""
import os, json, uuid
from typing import List, Optional
from pinecone import Pinecone, ServerlessSpec

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "prepagent")

_pc_client = None
_index = None

def get_pinecone_index():
    global _pc_client, _index
    if _index is None:
        _pc_client = Pinecone(api_key=PINECONE_API_KEY)
        
        # Check if index exists, create if not
        existing_indexes = [index_info["name"] for index_info in _pc_client.list_indexes()]
        if PINECONE_INDEX_NAME not in existing_indexes:
            print(f"Creating Pinecone index: {PINECONE_INDEX_NAME} (1024 dim)")
            _pc_client.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=1024,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            
        _index = _pc_client.Index(PINECONE_INDEX_NAME)
        # Verify stats and seed if empty
        stats = _index.describe_index_stats()
        if stats.total_vector_count == 0:
            _seed_sample_data(_index)
    return _index

def get_embedding(text: str, input_type: str = "passage") -> List[float]:
    global _pc_client
    if _pc_client is None:
        _pc_client = Pinecone(api_key=PINECONE_API_KEY)
    
    response = _pc_client.inference.embed(
        model="multilingual-e5-large",
        inputs=[text],
        parameters={"input_type": input_type}
    )
    return response.data[0].values

def _seed_sample_data(index):
    """Seed Pinecone with sample interview experience documents"""
    samples = [
        {
            "id": str(uuid.uuid4()),
            "text": "Boeing SWE interview 2024: 3 rounds. Round 1 - DSA (dynamic programming on graphs, Dijkstra), Round 2 - System Design (design flight scheduling system, focus on availability), Round 3 - Behavioral (STAR format, teamwork under pressure).",
            "metadata": {"company": "Boeing", "role": "Software Engineer", "year": 2024, "topics": json.dumps(["Dynamic Programming", "Dijkstra", "System Design", "Behavioral", "STAR"])}
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Boeing intern interview 2023: Mostly coding problems. Got asked about BFS/DFS on a graph representing airport connections. Also a behavioral about working with ambiguous requirements.",
            "metadata": {"company": "Boeing", "role": "Intern", "year": 2023, "topics": json.dumps(["BFS", "DFS", "Graphs", "Behavioral"])}
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Google L4 SWE 2024: 5 rounds. Heavy on LeetCode Hard DP. System design with strong focus on scalability. Behavioral using Googleyness framework. Also got a coding question on trie data structure.",
            "metadata": {"company": "Google", "role": "L4 SWE", "year": 2024, "topics": json.dumps(["Dynamic Programming", "Trie", "System Design", "Scalability", "Behavioral"])}
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Amazon SDE2 2024: 4 loops. Leadership Principles are crucial - prepare 2 stories per LP. Technical: system design for distributed systems, coding was medium difficulty arrays/trees/graphs.",
            "metadata": {"company": "Amazon", "role": "SDE2", "year": 2024, "topics": json.dumps(["Leadership Principles", "Distributed Systems", "Arrays", "Trees", "Graphs"])}
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Microsoft SWE 2024: 4 rounds. Coding (medium DP, trees), System design (design OneDrive), Behavioral, and a culture fit round. Interviewers are friendly. Focus on clean code and explaining your thought process.",
            "metadata": {"company": "Microsoft", "role": "SWE", "year": 2024, "topics": json.dumps(["Dynamic Programming", "Trees", "System Design", "Behavioral", "Culture Fit"])}
        },
    ]
    
    vectors = []
    for s in samples:
        emb = get_embedding(s["text"])
        # Pinecone metadata can store the text as well for retrieval
        meta = s["metadata"].copy()
        meta["text"] = s["text"]
        vectors.append({
            "id": s["id"],
            "values": emb,
            "metadata": meta
        })
    
    index.upsert(vectors=vectors)


async def retrieve_interview_experiences(
    company: str,
    role: str = "Software Engineer",
    top_k: int = 10,
) -> List[dict]:
    try:
        index = get_pinecone_index()
        query = f"{company} {role} software engineer interview experience"
        query_emb = get_embedding(query)
        
        filter_dict = {"company": {"$eq": company}} if company else None
        
        results = index.query(
            vector=query_emb,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True
        )
        
        docs = []
        for match in results.matches:
            meta = match.metadata or {}
            topics_raw = meta.get("topics", "[]")
            topics = json.loads(topics_raw) if isinstance(topics_raw, str) else topics_raw
            docs.append({
                "text": meta.get("text", ""),
                "company": meta.get("company", company),
                "role": meta.get("role", role),
                "year": int(meta.get("year", 2024)),
                "topics": topics,
                "distance": match.score, # Pinecone returns similarity score
            })
        return docs
    except Exception as e:
        print(f"Pinecone retrieval error: {e}")
        return []


async def add_interview_experience(
    text: str,
    company: str,
    role: str,
    year: int,
    topics: List[str],
) -> str:
    index = get_pinecone_index()
    doc_id = str(uuid.uuid4())
    emb = get_embedding(text)
    
    index.upsert(
        vectors=[{
            "id": doc_id,
            "values": emb,
            "metadata": {
                "text": text,
                "company": company,
                "role": role,
                "year": year,
                "topics": json.dumps(topics)
            }
        }]
    )
    return doc_id

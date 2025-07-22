"""
memory.py – Qdrant‑cloud long‑term memory
"""
import uuid, datetime, os
from typing import Dict, Any, List
from dotenv import load_dotenv

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from langchain_qdrant import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings

# ── env & config ───────────────────────────────────────────────
load_dotenv()
QDRANT_URL   = os.getenv("QDRANT_URL")
QDRANT_API   = os.getenv("QDRANT_API_KEY")
COLL_MEM     = "user_memory"
EMBED_MODEL  = "all-MiniLM-L6-v2"

_embedder = HuggingFaceEmbeddings(model_name=EMBED_MODEL)

_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API,
    prefer_grpc=True,
)

# create collection first run
if COLL_MEM not in [c.name for c in _client.get_collections().collections]:
    dim = len(_embedder.embed_query("probe"))
    _client.recreate_collection(
        collection_name=COLL_MEM,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )

_mem_vs = Qdrant(client=_client, collection_name=COLL_MEM, embeddings=_embedder)

# ── API ─────────────────────────────────────────────────────────
def add_message(user_id: str, text: str, emotion: str, fruit: str, intensity: float) -> None:
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "emotion": emotion,
        "fruit": fruit,
        "intensity": intensity,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    _mem_vs.add_texts([text], metadatas=[payload], ids=[str(uuid.uuid4())])

def recall(user_id: str, query: str, k: int = 3) -> List[str]:
    docs = _mem_vs.similarity_search(
        query,
        k=k,
        filter={"must": [{"key": "user_id", "match": {"value": user_id}}]},
    )
    return [d.page_content for d in docs]

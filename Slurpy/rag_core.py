
import os
from typing import List

from qdrant_client import QdrantClient
from langchain_qdrant import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# ----------  1. load vector index (1-2 s) ----------
INDEX_PATH = "ed_index_full"         
COLLECTION = "ed_chunks"

_embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
_qdrant   = Qdrant(
    client=QdrantClient(
        path=INDEX_PATH,
        force_disable_check_same_thread=True
    ),
    collection_name=COLLECTION,
    embeddings=_embedder,
)
_retriever = _qdrant.as_retriever(search_kwargs={"k": 4})

# ----------  2. LLM  ----------
_llm = ChatOpenAI(
    model="gpt-3.5-turbo",           
    temperature=0.6,
    model_kwargs={"max_tokens": 256}
)

_rag_chain = RetrievalQA.from_chain_type(
    llm=_llm,
    chain_type="stuff",
    retriever=_retriever,
    return_source_documents=True,
)

# ----------  3. public helper ----------
def slurpy_answer(message: str) -> dict:
    """
    Args
    ----
    message : user text

    Returns
    -------
    dict with keys:
        'answer'  : the LLM’s grounded reply
        'sources' : List[str] of retrieved snippets (first 120 chars each)
    """
    result = _rag_chain.invoke(message)

    sources: List[str] = [
        doc.page_content.strip().replace("\n", " ")[:120] + "…"
        for doc in result["source_documents"]
    ]

    return {
        "answer":  result["result"],
        "sources": sources,
    }


# ----------  4. basic CLI test ----------
if __name__ == "__main__":
    os.environ.setdefault("OPENAI_API_KEY", "sk-…")    
    while True:
        try:
            msg = input("You > ")
            out = slurpy_answer(msg)
            print("\nSlurpy:", out["answer"])
            print("\nSources:")
            for s in out["sources"]:
                print("•", s)
            print()
        except KeyboardInterrupt:
            break

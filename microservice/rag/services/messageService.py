from utils.vector_db import VectorDBClient
from typing import List, Optional, Any

def hybrid_retrieval(
    query: str,
    embedding: List[float],
    userId: str,
    collection_name: str,
    vector_db: VectorDBClient,
    top_k: int = 10,
    documentIds: Optional[List[str]] = None
) -> List[Any]:
    
    return vector_db.search_hybrid(
        collection_name=collection_name,
        query=query,
        userId=userId,
        documentIds=documentIds,
        embedding=embedding,
        top_k=top_k
    )
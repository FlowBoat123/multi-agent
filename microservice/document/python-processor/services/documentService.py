from utils.vector_db import VectorDBClient
from typing import List, Dict, Any, Optional
from utils.processData import process_data
from utils.chunking import regex_chunker

regex_chunker_instance = regex_chunker()

async def insert_semantic_document(userId: str, documentId: str, content: any, vector_db: VectorDBClient, collection_name: str):

    semantic_objs = await process_data(userId, documentId, content, regex_chunker_instance)
    await batch_create_documents(
        objs=semantic_objs,
        collection_name=collection_name,
        vector_db=vector_db
    )

async def create_document(
    collection_name: str,
    documentId: str,
    userId: str,
    text: str,
    embedding: List[float],
    metadata: Optional[Dict[str, Any]] = None,
    vector_db: VectorDBClient = VectorDBClient()
) -> str:
    """
    Thêm một document vào vector database.
    """
    return await vector_db.add_document(
        collection_name=collection_name,
        documentId=documentId,
        userId=userId,
        text=text,
        embedding=embedding,
        metadata=metadata
    )

async def batch_create_documents(
    objs: List[Any],
    collection_name: str,
    batch_size: int = 192,
    vector_db: VectorDBClient = VectorDBClient()
):
    """
    Thêm nhiều document vào vector database theo batch.
    """
    return await vector_db.batch_insert(
        objs=objs,
        collection_name=collection_name,
        batch_size=batch_size
    )

async def delete_document_by_id(
    documentId: str,
    collection_name: str,
    vector_db: VectorDBClient = VectorDBClient()
):
    """
    Xóa document theo document_id.
    """
    return await vector_db.delete_by_document_id(
        documentId=documentId,
        collection_name=collection_name
    )
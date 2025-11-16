from services.documentService import delete_document_by_id
from utils.logger import logger
from utils.vector_db import VectorDBClient
import os
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any

class DocumentDeletionError(Exception):
    """Custom exception for document deletion errors"""
    pass

@asynccontextmanager
async def get_vector_db():
    """Context manager for VectorDB connection"""
    vector_db = None
    try:
        vector_db = VectorDBClient()
        yield vector_db
    except Exception as e:
        logger.error(f"[Delete] Failed to initialize VectorDB: {e}")
        raise
    finally:
        if vector_db:
            try:
                vector_db.close()
                logger.debug("[Delete] VectorDB connection closed")
            except Exception as e:
                logger.warning(f"[Delete] Error closing VectorDB: {e}")

async def delete_document(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Delete document with comprehensive error handling
    
    Args:
        data: Dictionary containing documentId, userId, and name
        
    Returns:
        Dictionary with success message
        
    Raises:
        DocumentDeletionError: When document deletion fails
        ValueError: When required data is missing
    """
    # Validate required fields
    required_fields = ["documentId", "userId"]  # name is optional for deletion
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
    
    document_id = data.get("documentId")
    user_id = data.get("userId")
    file_name = data.get("name", "unknown")
    
    logger.info(f"[Delete] Starting document deletion - User: {user_id}, Doc: {document_id}, File: {file_name}")
    
    try:
        collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
        logger.info(f"[Delete] Deleting from collection: {collection_name}")
        
        async with get_vector_db() as vector_db:
            try:
                # Add timeout for deletion operation
                result = await asyncio.wait_for(
                    delete_document_by_id(
                        documentId=document_id,
                        collection_name=collection_name,
                        vector_db=vector_db
                    ),
                    timeout=120.0  # 2 minutes timeout for deletion
                )
                
                logger.info(f"[Delete] Document deleted successfully - User: {user_id}, Doc: {document_id}")
                
                return {
                    "message": "Document deleted successfully",
                    "documentId": document_id,
                    "userId": user_id,
                    "fileName": file_name
                }
                
            except asyncio.TimeoutError:
                raise DocumentDeletionError(f"Document deletion timeout for ID: {document_id}")
            except Exception as e:
                # Check if it's a "document not found" error (adjust based on your vector DB implementation)
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ["not found", "does not exist", "not exist"]):
                    logger.warning(f"[Delete] Document {document_id} not found in vector DB")
                    return {
                        "message": "Document not found (already deleted or never existed)",
                        "documentId": document_id,
                        "userId": user_id,
                        "fileName": file_name
                    }
                else:
                    raise DocumentDeletionError(f"Failed to delete document from vector DB: {str(e)}")

    except DocumentDeletionError:
        # Re-raise custom exceptions as-is
        raise
    except ValueError:
        # Re-raise validation errors as-is
        raise
    except Exception as e:
        logger.error(f"[Delete] Unexpected error deleting document {document_id}: {e}", exc_info=True)
        raise DocumentDeletionError(f"Unexpected error during document deletion: {str(e)}")

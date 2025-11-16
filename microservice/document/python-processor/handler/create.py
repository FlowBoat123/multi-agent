from services.documentService import insert_semantic_document
from utils.loadData import loadData
from utils.minio import getFile
from utils.logger import logger
from utils.vector_db import VectorDBClient
import os
import tempfile
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any

class DocumentCreationError(Exception):
    """Custom exception for document creation errors"""
    pass

class FileProcessingError(Exception):
    """Custom exception for file processing errors"""
    pass

@asynccontextmanager
async def get_vector_db():
    """Context manager for VectorDB connection"""
    vector_db = None
    try:
        vector_db = VectorDBClient()
        yield vector_db
    except Exception as e:
        logger.error(f"[Create] Failed to initialize VectorDB: {e}")
        raise
    finally:
        if vector_db:
            try:
                vector_db.close()
                logger.debug("[Create] VectorDB connection closed")
            except Exception as e:
                logger.warning(f"[Create] Error closing VectorDB: {e}")

async def create_document(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Create document with comprehensive error handling and enhanced metadata tracking
    
    Args:
        data: Dictionary containing userId, documentId, and name
        
    Returns:
        Dictionary with success message
        
    Raises:
        DocumentCreationError: When document creation fails
        FileProcessingError: When file processing fails
        ValueError: When required data is missing
    """
    # Validate required fields
    required_fields = ["userId", "documentId", "name"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
    
    user_id = data.get("userId")
    document_id = data.get("documentId")
    file_name = data.get("name")
    
    logger.info(f"[Create] Starting document creation - User: {user_id}, Doc: {document_id}, File: {file_name}")
    
    temp_file_path = None
    
    try:
        # Step 1: Download file from MinIO with timeout
        logger.info(f"[Create] Downloading file from MinIO: {file_name}")
        
        try:
            temp_file_path = await asyncio.wait_for(
                asyncio.to_thread(getFile, user_id, file_name),
                timeout=300.0  # 5 minutes timeout
            )
            
            if not temp_file_path or not os.path.exists(temp_file_path):
                raise FileProcessingError(f"File download failed or file not found: {file_name}")
                
            file_size = os.path.getsize(temp_file_path)
            logger.info(f"[Create] File downloaded successfully: {temp_file_path} (size: {file_size} bytes)")
            
        except asyncio.TimeoutError:
            raise FileProcessingError(f"File download timeout for: {file_name}")
        except Exception as e:
            raise FileProcessingError(f"Failed to download file {file_name}: {str(e)}")

        # Step 2: Load and process file content with enhanced metadata
        logger.info(f"[Create] Processing file content: {temp_file_path}")
        
        try:
            # Pass document_id to loadData for metadata enhancement
            content = await asyncio.wait_for(
                loadData(temp_file_path, document_id=document_id),
                timeout=600.0  # 10 minutes timeout for processing
            )
            
            if not content:
                raise FileProcessingError(f"No content extracted from file: {file_name}")
                
            content_length = len(content) if isinstance(content, str) else len(str(content))
            logger.info(f"[Create] Content loaded successfully (length: {content_length} characters)")
            
            # Log metadata information for debugging
            if content and len(content) > 0:
                sample_metadata = content[0].get('metadata', {})
                logger.info(f"[Create] Sample metadata: {sample_metadata}")
            
        except asyncio.TimeoutError:
            raise FileProcessingError(f"File processing timeout for: {file_name}")
        except Exception as e:
            raise FileProcessingError(f"Failed to process file content {file_name}: {str(e)}")

        # Step 3: Insert into vector database
        collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
        logger.info(f"[Create] Inserting document into collection: {collection_name}")
        
        async with get_vector_db() as vector_db:
            try:
                await asyncio.wait_for(
                    insert_semantic_document(
                        userId=user_id,
                        documentId=document_id,
                        content=content,
                        collection_name=collection_name,
                        vector_db=vector_db
                    ),
                    timeout=300.0  # 5 minutes timeout for vector insertion
                )
                
                logger.info(f"[Create] Document inserted successfully - User: {user_id}, Doc: {document_id}")
                
            except asyncio.TimeoutError:
                raise DocumentCreationError(f"Vector database insertion timeout for document: {document_id}")
            except Exception as e:
                raise DocumentCreationError(f"Failed to insert document into vector DB: {str(e)}")

        return {
            "message": "Document created successfully",
            "documentId": document_id,
            "userId": user_id,
            "fileName": file_name,
            "contentLength": content_length,
            "collection": collection_name
        }

    except (DocumentCreationError, FileProcessingError, ValueError):
        raise
    except Exception as e:
        logger.error(f"[Create] Unexpected error creating document {document_id}: {e}", exc_info=True)
        raise DocumentCreationError(f"Unexpected error during document creation: {str(e)}")
        
    finally:
        # Cleanup: Remove temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"[Create] Temporary file cleaned up: {temp_file_path}")
            except Exception as e:
                logger.warning(f"[Create] Failed to cleanup temporary file {temp_file_path}: {e}")
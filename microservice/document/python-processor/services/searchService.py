from utils.vector_db import VectorDBClient
from typing import List, Dict, Any, Optional
from utils.logger import logger
import os
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_vector_db():
    """Context manager for VectorDB connection"""
    vector_db = None
    try:
        vector_db = VectorDBClient()
        yield vector_db
    except Exception as e:
        logger.error(f"[Search] Failed to initialize VectorDB: {e}")
        raise
    finally:
        if vector_db:
            try:
                vector_db.close()
                logger.debug("[Search] VectorDB connection closed")
            except Exception as e:
                logger.warning(f"[Search] Error closing VectorDB: {e}")

async def search_documents(
    query: str,
    user_id: str,
    limit: int = 10,
    collection_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search documents and return results with document viewing links
    
    Args:
        query: Search query text
        user_id: User ID for filtering
        limit: Maximum number of results
        collection_name: Collection to search in
        
    Returns:
        Dictionary containing search results with metadata and view links
    """
    if not collection_name:
        collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
    
    logger.info(f"[Search] Searching query: '{query}' for user: {user_id}")
    
    try:
        async with get_vector_db() as vector_db:
            results = await vector_db.search_similar(
                collection_name=collection_name,
                query_text=query,
                limit=limit,
                user_id=user_id
            )
            
            # Process and enrich results
            processed_results = []
            unique_documents = set()
            
            for result in results:
                metadata = result.get('metadata', {})
                document_id = result.get('document_id')
                
                # Create enhanced result object
                processed_result = {
                    'chunk_id': result.get('uuid'),
                    'content': result.get('text', ''),
                    'score': result.get('score', 0),
                    'distance': result.get('distance', 0),
                    
                    # Document information
                    'document': {
                        'id': document_id,
                        'name': metadata.get('file_name', ''),
                        'source': metadata.get('source', ''),
                        'minio_path': metadata.get('minio_path', '')
                    },
                    
                    # Chunk position information
                    'position': {
                        'page_number': metadata.get('page_number', 0),
                        'chunk_index': metadata.get('chunk_index', 0),
                        'start_position': metadata.get('start_position', 0),
                        'end_position': metadata.get('end_position', 0),
                        'chunk_length': metadata.get('chunk_length', 0)
                    },
                    
                    # View links
                    'links': {
                        'view_url': result.get('view_url', ''),
                        'direct_link': _generate_direct_link(document_id, metadata),
                        'download_url': f"/api/document/{document_id}/download"
                    },
                    
                    # Additional metadata
                    'metadata': {
                        'keywords': metadata.get('keywords', []),
                        'processing_method': metadata.get('processing_method', ''),
                        'word_count': len(result.get('text', '').split()) if result.get('text') else 0
                    }
                }
                
                processed_results.append(processed_result)
                unique_documents.add(document_id)
            
            # Generate search summary
            summary = {
                'total_results': len(processed_results),
                'unique_documents': len(unique_documents),
                'max_score': max([r.get('score', 0) for r in processed_results], default=0),
                'query': query,
                'collection': collection_name
            }
            
            logger.info(f"[Search] Found {len(processed_results)} results from {len(unique_documents)} documents")
            
            return {
                'success': True,
                'summary': summary,
                'results': processed_results
            }
            
    except Exception as e:
        logger.error(f"[Search] Error searching documents: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'results': []
        }

def _generate_direct_link(document_id: str, metadata: Dict[str, Any]) -> str:
    """Generate direct link to document viewer"""
    base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    page = metadata.get('page_number', 0)
    start_pos = metadata.get('start_position', 0)
    
    if page > 0:
        return f"{base_url}/viewer/{document_id}?page={page}&position={start_pos}&highlight=true"
    else:
        return f"{base_url}/viewer/{document_id}?position={start_pos}&highlight=true"

async def get_document_chunks(
    document_id: str,
    user_id: str,
    collection_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get all chunks for a specific document
    
    Args:
        document_id: Document ID
        user_id: User ID for filtering
        collection_name: Collection to search in
        
    Returns:
        Dictionary containing all chunks for the document
    """
    if not collection_name:
        collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
    
    logger.info(f"[Search] Getting chunks for document: {document_id}")
    
    try:
        async with get_vector_db() as vector_db:
            # Search for all chunks of this document
            # Note: This is a simplified approach, you might want to implement a specific method
            results = await vector_db.search_similar(
                collection_name=collection_name,
                query_text="",  # Empty query to get all
                limit=1000,  # Large limit to get all chunks
                user_id=user_id
            )
            
            # Filter results by document_id
            document_chunks = [
                result for result in results 
                if result.get('document_id') == document_id
            ]
            
            # Sort by chunk index
            document_chunks.sort(key=lambda x: x.get('metadata', {}).get('chunk_index', 0))
            
            return {
                'success': True,
                'document_id': document_id,
                'total_chunks': len(document_chunks),
                'chunks': document_chunks
            }
            
    except Exception as e:
        logger.error(f"[Search] Error getting document chunks: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'chunks': []
        }

async def search_within_document(
    query: str,
    document_id: str,
    user_id: str,
    limit: int = 20,
    collection_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search within a specific document
    
    Args:
        query: Search query
        document_id: Document ID to search within
        user_id: User ID for filtering
        limit: Maximum number of results
        collection_name: Collection to search in
        
    Returns:
        Search results within the specific document
    """
    if not collection_name:
        collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
    
    logger.info(f"[Search] Searching '{query}' within document: {document_id}")
    
    try:
        # First get all results for the query
        search_results = await search_documents(
            query=query,
            user_id=user_id,
            limit=limit * 2,  # Get more to filter
            collection_name=collection_name
        )
        
        if not search_results.get('success'):
            return search_results
        
        # Filter results by document_id
        filtered_results = [
            result for result in search_results.get('results', [])
            if result.get('document', {}).get('id') == document_id
        ]
        
        # Limit results
        filtered_results = filtered_results[:limit]
        
        return {
            'success': True,
            'summary': {
                'total_results': len(filtered_results),
                'document_id': document_id,
                'query': query,
                'collection': collection_name
            },
            'results': filtered_results
        }
        
    except Exception as e:
        logger.error(f"[Search] Error searching within document: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'results': []
        }
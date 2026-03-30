import logging
from typing import List, Dict, Any, Optional
import weaviate
from weaviate.classes.config import Property, DataType
from weaviate.classes.query import MetadataQuery
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class VectorDBClient:
    def __init__(self, host: str = "localhost", port: int = 8080):
        self.host = os.getenv("VECTOR_DB_HOST", host)
        self.port = int(os.getenv("VECTOR_DB_PORT", port))
        self.url = f"http://{self.host}:{self.port}"
        
        try:
            self.client = weaviate.connect_to_local(
                host=self.host,
                port=self.port,
            )
            
            if self.client.is_ready():
                logger.info(f"Successfully connected to Weaviate at {self.url}")
            else:
                raise ConnectionError("Weaviate is not ready")
                
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate at {self.url}: {e}")
            raise ConnectionError(f"Could not connect to Weaviate: {e}")
    
    def close(self):
        """Close the connection to Weaviate"""
        try:
            self.client.close()
            logger.info("Weaviate connection closed")
        except Exception as e:
            logger.error(f"Error closing Weaviate connection: {e}")
        
    def reset_schema(self):
        """Delete all collections"""
        try:
            collections = self.client.collections.list_all()
            for collection_name in collections:
                try:
                    self.client.collections.delete(collection_name)
                    logger.info(f"Deleted collection: {collection_name}")
                except Exception as e:
                    logger.warning(f"Could not delete collection {collection_name}: {e}")
            
            logger.info("Schema reset completed")
        except Exception as e:
            logger.error(f"Error resetting schema: {e}")
            raise

    def create_schema(self, collections: set):
        """Create collections with basic metadata properties"""
        try:
            for collection_name in collections:
                if self.client.collections.exists(collection_name):
                    continue
                
                collection = self.client.collections.create(
                    name=collection_name,
                    properties=[
                        # Basic properties
                        Property(name="userId", data_type=DataType.TEXT),
                        Property(name="documentId", data_type=DataType.TEXT),
                        Property(name="text", data_type=DataType.TEXT),
                        
                        # Document metadata
                        Property(name="fileName", data_type=DataType.TEXT),
                        Property(name="source", data_type=DataType.TEXT),
                        Property(name="pageNumber", data_type=DataType.INT),
                        Property(name="totalLength", data_type=DataType.INT),
                        Property(name="minioPath", data_type=DataType.TEXT),
                        
                        # Chunk-specific metadata
                        Property(name="chunkIndex", data_type=DataType.INT),
                        Property(name="startPosition", data_type=DataType.INT),
                        Property(name="endPosition", data_type=DataType.INT),
                        Property(name="chunkLength", data_type=DataType.INT),
                        
                        # Additional metadata
                        Property(name="processingMethod", data_type=DataType.TEXT),
                        Property(name="keywords", data_type=DataType.TEXT_ARRAY),
                        Property(name="fileType", data_type=DataType.TEXT),
                    ]
                )
                
                logger.info(f"Created collection: {collection_name}")
                
        except Exception as e:
            logger.error(f"Error creating schema: {e}")
            raise
    
    async def add_document(
        self,
        collection_name: str,
        documentId: str,
        userId: str,
        text: str,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Add a single document to collection"""
        try:
            self.create_schema({collection_name})
            collection = self.client.collections.get(collection_name)
            
            # Prepare data object with metadata
            data_object = {
                "text": text,
                "documentId": documentId,
                "userId": userId,
                "fileName": metadata.get('file_name', '') if metadata else '',
                "source": metadata.get('source', '') if metadata else '',
                "pageNumber": metadata.get('page_number', 0) if metadata else 0,
                "totalLength": metadata.get('total_length', 0) if metadata else 0,
                "minioPath": metadata.get('minio_path', '') if metadata else '',
                "chunkIndex": metadata.get('chunk_index', 0) if metadata else 0,
                "startPosition": metadata.get('start_position', 0) if metadata else 0,
                "endPosition": metadata.get('end_position', 0) if metadata else 0,
                "chunkLength": metadata.get('chunk_length', len(text)) if metadata else len(text),
                "processingMethod": metadata.get('processing_method', '') if metadata else '',
                "keywords": metadata.get('keywords', []) if metadata else [],
                "fileType": metadata.get('file_type', 'unknown') if metadata else 'unknown',
            }
            
            if embedding:
                uuid_result = collection.data.insert(
                    properties=data_object,
                    vector=embedding
                )
            else:
                uuid_result = collection.data.insert(properties=data_object)
            
            logger.info(f"Document added with UUID: {uuid_result}")
            return str(uuid_result)
            
        except Exception as e:
            logger.error(f"Error adding document to Weaviate: {e}")
            raise

    async def batch_insert(
        self,
        objs: List[Any],
        collection_name: str,
        batch_size: int = 100
    ):
        """Batch insert documents with metadata"""
        try:
            self.create_schema({collection_name})
            collection = self.client.collections.get(collection_name)
            
            for i in range(0, len(objs), batch_size):
                batch = objs[i:i + batch_size]
                
                try:
                    with collection.batch.dynamic() as batch_context:
                        for obj in batch:
                            vector = obj.get("vector")
                            metadata = obj.get("metadata", {})
                            
                            # Prepare properties with metadata
                            properties = {
                                "documentId": obj.get("documentId"),
                                "userId": obj.get("userId"),
                                "text": obj.get("text"),
                                "fileName": metadata.get('file_name', ''),
                                "source": metadata.get('source', ''),
                                "pageNumber": metadata.get('page_number', 0),
                                "totalLength": metadata.get('total_length', 0),
                                "minioPath": metadata.get('minio_path', ''),
                                "chunkIndex": metadata.get('chunk_index', 0),
                                "startPosition": metadata.get('start_position', 0),
                                "endPosition": metadata.get('end_position', 0),
                                "chunkLength": metadata.get('chunk_length', 0),
                                "processingMethod": metadata.get('processing_method', ''),
                                "keywords": metadata.get('keywords', []),
                                "fileType": metadata.get('file_type', 'unknown'),
                            }

                            if vector is not None:
                                batch_context.add_object(
                                    properties=properties,
                                    vector=vector
                                )
                            else:
                                batch_context.add_object(properties=properties)

                    logger.info(f"✅ Batch {i + 1} to {i + len(batch)} inserted successfully!")
                
                except Exception as batch_error:
                    logger.error(f"⚠️ Error inserting batch {i + 1} to {i + len(batch)}: {batch_error}")
                    
        except Exception as e:
            logger.error(f"Error during batch insert: {e}")
            raise

    async def delete_by_document_id(
        self,
        documentId: str,
        collection_name: str
    ):
        """Delete documents by documentId"""
        try:
            self.create_schema({collection_name})
            collection = self.client.collections.get(collection_name)
            
            result = collection.data.delete_many(
                where=weaviate.classes.query.Filter.by_property("documentId").equal(documentId)
            )
            
            logger.info(f"Successfully deleted {result.successful} records with document_id: {documentId}")
            
            if result.failed > 0:
                logger.warning(f"Failed to delete {result.failed} records")
                
        except Exception as e:
            logger.error(f"Error deleting records with document_id: {documentId}. Error: {e}")
            raise
    
    async def search_similar(
        self,
        collection_name: str,
        query_text: str,
        limit: int = 10,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        page_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        try:
            collection = self.client.collections.get(collection_name)
            
            # Build filters
            filters = []
            if user_id:
                filters.append(weaviate.classes.query.Filter.by_property("userId").equal(user_id))
            if document_id:
                filters.append(weaviate.classes.query.Filter.by_property("documentId").equal(document_id))
            if page_number is not None:
                filters.append(weaviate.classes.query.Filter.by_property("pageNumber").equal(page_number))
            
            # Combine filters
            where_filter = None
            if filters:
                if len(filters) == 1:
                    where_filter = filters[0]
                else:
                    where_filter = weaviate.classes.query.Filter.all_of(filters)
            
            response = collection.query.near_text(
                query=query_text,
                limit=limit,
                filters=where_filter,
                return_metadata=MetadataQuery(score=True, distance=True)
            )
            
            results = []
            for obj in response.objects:
                properties = obj.properties
                
                # Reconstruct metadata
                metadata = {
                    'file_name': properties.get('fileName', ''),
                    'source': properties.get('source', ''),
                    'page_number': properties.get('pageNumber', 0),
                    'total_length': properties.get('totalLength', 0),
                    'minio_path': properties.get('minioPath', ''),
                    'chunk_index': properties.get('chunkIndex', 0),
                    'start_position': properties.get('startPosition', 0),
                    'end_position': properties.get('endPosition', 0),
                    'chunk_length': properties.get('chunkLength', 0),
                    'file_type': properties.get('fileType', 'unknown'),
                }
                
                results.append({
                    "uuid": str(obj.uuid),
                    "document_id": properties.get('documentId'),
                    "user_id": properties.get('userId'),
                    "text": properties.get('text'),
                    "metadata": metadata,
                    "score": obj.metadata.score if obj.metadata else None,
                    "distance": obj.metadata.distance if obj.metadata else None,
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching collection {collection_name}: {e}")
            raise
    
    async def search_hybrid(
        self,
        collection_name: str,
        query: str,
        embedding: Optional[List[float]] = None,
        top_k: int = 10,
        alpha: float = 0.5,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        page_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining vector similarity and keyword search
        
        Args:
            collection_name: Name of the collection to search
            query: Search query text
            embedding: Pre-computed embedding vector (optional, if not provided will use query text)
            top_k: Maximum number of results
            alpha: Balance between vector (1.0) and keyword (0.0) search. Default 0.5 for balanced
            user_id: Filter by user ID
            document_id: Filter by document ID
            page_number: Filter by page number
            
        Returns:
            List of search results with metadata
        """
        try:
            collection = self.client.collections.get(collection_name)
            
            # Build filters
            filters = []
            if user_id:
                filters.append(weaviate.classes.query.Filter.by_property("userId").equal(user_id))
            if document_id:
                filters.append(weaviate.classes.query.Filter.by_property("documentId").equal(document_id))
            if page_number is not None:
                filters.append(weaviate.classes.query.Filter.by_property("pageNumber").equal(page_number))
            
            # Combine filters
            where_filter = None
            if filters:
                if len(filters) == 1:
                    where_filter = filters[0]
                else:
                    where_filter = weaviate.classes.query.Filter.all_of(filters)
            
            # Perform hybrid search with embedding if provided
            if embedding:
                response = collection.query.hybrid(
                    query=query,
                    vector=embedding,
                    alpha=alpha,
                    limit=top_k,
                    filters=where_filter,
                    return_metadata=MetadataQuery(score=True, explain_score=True)
                )
            else:
                response = collection.query.hybrid(
                    query=query,
                    alpha=alpha,
                    limit=top_k,
                    filters=where_filter,
                    return_metadata=MetadataQuery(score=True, explain_score=True)
                )
            
            results = []
            for obj in response.objects:
                properties = obj.properties
                
                # Reconstruct metadata
                metadata = {
                    'file_name': properties.get('fileName', ''),
                    'source': properties.get('source', ''),
                    'page_number': properties.get('pageNumber', 0),
                    'minio_path': properties.get('minioPath', ''),
                    'chunk_index': properties.get('chunkIndex', 0),
                    'chunk_length': properties.get('chunkLength', 0),
                    'file_type': properties.get('fileType', 'unknown'),
                }
                
                results.append({
                    "uuid": str(obj.uuid),
                    "document_id": properties.get('documentId'),
                    "user_id": properties.get('userId'),
                    "text": properties.get('text'),
                    "metadata": metadata,
                    "score": obj.metadata.score if obj.metadata else None,
                    "explain_score": obj.metadata.explain_score if obj.metadata else None,
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error performing hybrid search on collection {collection_name}: {e}")
            raise
        
    async def search_by_chunk_range(
        self,
        collection_name: str,
        document_id: str,
        start_chunk_index: int,
        num_chunks: int = 4,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Tìm kiếm các chunks liên tiếp từ một document bắt đầu từ chunk_index
        
        Args:
            collection_name: Tên collection
            document_id: ID của document
            start_chunk_index: Chunk index bắt đầu
            num_chunks: Số lượng chunks cần lấy (mặc định 4)
            user_id: Filter theo user ID (optional)
            
        Returns:
            List of chunks được sắp xếp theo chunk_index
        """
        try:
            collection = self.client.collections.get(collection_name)
            
            # Build filters
            filters = [
                weaviate.classes.query.Filter.by_property("documentId").equal(document_id),
                weaviate.classes.query.Filter.by_property("chunkIndex").greater_or_equal(start_chunk_index),
                weaviate.classes.query.Filter.by_property("chunkIndex").less_than(start_chunk_index + num_chunks)
            ]
            
            if user_id:
                filters.append(weaviate.classes.query.Filter.by_property("userId").equal(user_id))
            
            where_filter = weaviate.classes.query.Filter.all_of(filters)
            
            # Query với limit lớn hơn để đảm bảo lấy đủ
            response = collection.query.fetch_objects(
                filters=where_filter,
                limit=num_chunks * 2  # Lấy nhiều hơn để đảm bảo
            )
            
            results = []
            for obj in response.objects:
                properties = obj.properties
                
                # Reconstruct metadata
                metadata = {
                    'file_name': properties.get('fileName', ''),
                    'source': properties.get('source', ''),
                    'page_number': properties.get('pageNumber', 0),
                    'minio_path': properties.get('minioPath', ''),
                    'chunk_index': properties.get('chunkIndex', 0),
                    'file_type': properties.get('fileType', 'unknown'),
                }
                
                results.append({
                    "uuid": str(obj.uuid),
                    "document_id": properties.get('documentId'),
                    "user_id": properties.get('userId'),
                    "text": properties.get('text'),
                    "metadata": metadata,
                    "chunk_index": properties.get('chunkIndex', 0),
                })
            
            # Sắp xếp theo chunk_index và lấy đúng số lượng cần thiết
            results.sort(key=lambda x: x['chunk_index'])
            return results[:num_chunks]
            
        except Exception as e:
            logger.error(f"Error searching by chunk range in collection {collection_name}: {e}")
            raise

# Usage example
if __name__ == "__main__":
    collections = {"Regex_semantic"}
    
    try:
        db = VectorDBClient()
        db.reset_schema()
        db.create_schema(collections)
        logger.info("Weaviate setup completed successfully!")
        
    except Exception as e:
        logger.error(f"Setup failed: {e}")
    finally:
        if 'db' in locals():
            db.close()
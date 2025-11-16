import logging
from typing import List, Dict, Any, Optional
import weaviate
from weaviate.classes.config import Property, DataType
from weaviate.classes.query import MetadataQuery
import os
import json
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
        """Create collections with enhanced metadata properties including coordinate support"""
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
                        
                        # Coordinate information (stored as JSON strings)
                        Property(name="hasCoordinates", data_type=DataType.BOOL),
                        Property(name="coordinateSupport", data_type=DataType.BOOL),
                        Property(name="coordinates", data_type=DataType.TEXT),  # JSON string
                        Property(name="pageSize", data_type=DataType.TEXT),    # JSON string
                        Property(name="totalChars", data_type=DataType.INT),
                        
                        # Additional metadata
                        Property(name="processingMethod", data_type=DataType.TEXT),
                        Property(name="keywords", data_type=DataType.TEXT_ARRAY),
                        Property(name="fileType", data_type=DataType.TEXT),
                        
                        # Bbox coordinates as separate fields for easier querying
                        Property(name="bboxX0", data_type=DataType.NUMBER),
                        Property(name="bboxY0", data_type=DataType.NUMBER),
                        Property(name="bboxX1", data_type=DataType.NUMBER),
                        Property(name="bboxY1", data_type=DataType.NUMBER),
                    ]
                )
                
                logger.info(f"Created collection: {collection_name}")
                
        except Exception as e:
            logger.error(f"Error creating schema: {e}")
            raise
    
    def _extract_coordinate_data(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and format coordinate data from metadata"""
        coord_data = {
            "hasCoordinates": False,
            "coordinateSupport": False,
            "coordinates": "",
            "pageSize": "",
            "totalChars": 0,
            "bboxX0": 0.0,
            "bboxY0": 0.0,
            "bboxX1": 0.0,
            "bboxY1": 0.0,
        }
        
        if not metadata:
            return coord_data
        
        # Check if coordinates are available
        coordinates = metadata.get('coordinates')
        if coordinates:
            coord_data["hasCoordinates"] = True
            coord_data["coordinates"] = json.dumps(coordinates)
            
            # Extract bbox for easier querying
            bbox = coordinates.get('bbox', [0, 0, 0, 0])
            if len(bbox) >= 4:
                coord_data["bboxX0"] = float(bbox[0])
                coord_data["bboxY0"] = float(bbox[1])
                coord_data["bboxX1"] = float(bbox[2])
                coord_data["bboxY1"] = float(bbox[3])
        
        # Page size information
        page_size = metadata.get('page_size', {})
        if page_size:
            coord_data["pageSize"] = json.dumps(page_size)
        
        # Other coordinate-related metadata
        coord_data["coordinateSupport"] = metadata.get('coordinate_support', False)
        coord_data["totalChars"] = metadata.get('total_chars', 0)
        
        return coord_data
    
    async def add_document(
        self,
        collection_name: str,
        documentId: str,
        userId: str,
        text: str,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Add a single document to collection with coordinate support"""
        try:
            self.create_schema({collection_name})
            collection = self.client.collections.get(collection_name)
            
            # Extract coordinate data
            coord_data = self._extract_coordinate_data(metadata)
            
            # Prepare data object with all metadata
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
            
            # Add coordinate data
            data_object.update(coord_data)
            
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
        """Batch insert documents with enhanced metadata and coordinate support"""
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
                            
                            # Extract coordinate data
                            coord_data = self._extract_coordinate_data(metadata)
                            
                            # Prepare properties with all metadata
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
                            
                            # Add coordinate data
                            properties.update(coord_data)

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
        page_number: Optional[int] = None,
        has_coordinates: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents with enhanced metadata and coordinate filtering"""
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
            if has_coordinates is not None:
                filters.append(weaviate.classes.query.Filter.by_property("hasCoordinates").equal(has_coordinates))
            
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
                where=where_filter,
                return_metadata=MetadataQuery(score=True, distance=True)
            )
            
            results = []
            for obj in response.objects:
                properties = obj.properties
                
                # Reconstruct coordinate information
                coordinates = None
                if properties.get('coordinates'):
                    try:
                        coordinates = json.loads(properties.get('coordinates', '{}'))
                    except json.JSONDecodeError:
                        coordinates = None
                
                page_size = None
                if properties.get('pageSize'):
                    try:
                        page_size = json.loads(properties.get('pageSize', '{}'))
                    except json.JSONDecodeError:
                        page_size = {}
                
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
                    # Coordinate information
                    'coordinates': coordinates,
                    'has_coordinates': properties.get('hasCoordinates', False),
                    'coordinate_support': properties.get('coordinateSupport', False),
                    'page_size': page_size,
                    'total_chars': properties.get('totalChars', 0),
                    'bbox': [
                        properties.get('bboxX0', 0),
                        properties.get('bboxY0', 0),
                        properties.get('bboxX1', 0),
                        properties.get('bboxY1', 0)
                    ] if properties.get('hasCoordinates', False) else None
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
    
    async def search_by_coordinates(
        self,
        collection_name: str,
        x0: float, y0: float, x1: float, y1: float,
        page_number: int,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for documents by coordinate range"""
        try:
            collection = self.client.collections.get(collection_name)
            
            # Build coordinate filters - find chunks that overlap with the given area
            filters = [
                weaviate.classes.query.Filter.by_property("hasCoordinates").equal(True),
                weaviate.classes.query.Filter.by_property("pageNumber").equal(page_number),
                # Overlap conditions: chunks that intersect with the search area
                weaviate.classes.query.Filter.by_property("bboxX0").less_than_equal(x1),
                weaviate.classes.query.Filter.by_property("bboxX1").greater_than_equal(x0),
                weaviate.classes.query.Filter.by_property("bboxY0").less_than_equal(y1),
                weaviate.classes.query.Filter.by_property("bboxY1").greater_than_equal(y0),
            ]
            
            if user_id:
                filters.append(weaviate.classes.query.Filter.by_property("userId").equal(user_id))
            if document_id:
                filters.append(weaviate.classes.query.Filter.by_property("documentId").equal(document_id))
            
            where_filter = weaviate.classes.query.Filter.all_of(filters)
            
            response = collection.query.fetch_objects(
                where=where_filter,
                limit=limit,
                return_metadata=MetadataQuery(score=False, distance=False)
            )
            
            results = []
            for obj in response.objects:
                properties = obj.properties
                
                # Reconstruct coordinate information
                coordinates = None
                if properties.get('coordinates'):
                    try:
                        coordinates = json.loads(properties.get('coordinates', '{}'))
                    except json.JSONDecodeError:
                        coordinates = None
                
                # Reconstruct metadata (same as search_similar)
                metadata = {
                    'file_name': properties.get('fileName', ''),
                    'source': properties.get('source', ''),
                    'page_number': properties.get('pageNumber', 0),
                    'chunk_index': properties.get('chunkIndex', 0),
                    'coordinates': coordinates,
                    'has_coordinates': properties.get('hasCoordinates', False),
                    'bbox': [
                        properties.get('bboxX0', 0),
                        properties.get('bboxY0', 0),
                        properties.get('bboxX1', 0),
                        properties.get('bboxY1', 0)
                    ]
                }
                
                results.append({
                    "uuid": str(obj.uuid),
                    "document_id": properties.get('documentId'),
                    "user_id": properties.get('userId'),
                    "text": properties.get('text'),
                    "metadata": metadata,
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching by coordinates in collection {collection_name}: {e}")
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
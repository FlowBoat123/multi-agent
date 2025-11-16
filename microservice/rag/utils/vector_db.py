import logging
from typing import List, Dict, Any, Optional
import weaviate
from weaviate.classes.config import Configure, Property, DataType
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
            # Weaviate v4 client initialization
            self.client = weaviate.connect_to_local(
                host=self.host,
                port=self.port,
                # grpc_port=50051,  # Default gRPC port
                # headers={
                #     # Add any headers if needed, like API keys
                #     # "X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY", ""),
                #     # "X-Cohere-Api-Key": os.getenv("COHERE_API_KEY", "")
                # }
            )
            
            # Test connection
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
            # Get all collections and delete them
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
        """Create collections with proper v4 syntax"""
        try:
            for collection_name in collections:
                # Check if collection already exists
                if self.client.collections.exists(collection_name):
                    # logger.info(f"Collection {collection_name} already exists, skipping...")
                    continue
                
                # Create collection with v4 API
                collection = self.client.collections.create(
                    name=collection_name,
                    # # Configure vectorizer (optional - remove if not using OpenAI)
                    # vectorizer_config=Configure.Vectorizer.text2vec_openai(
                    #     model="text-embedding-3-small"
                    # ) if os.getenv("OPENAI_API_KEY") else None,
                    
                    # # Configure generative module (optional - remove if not using)
                    # generative_config=Configure.Generative.openai(
                    #     model="gpt-3.5-turbo"
                    # ) if os.getenv("OPENAI_API_KEY") else None,
                    
                    # Define properties
                    properties=[
                        Property(name="userId", data_type=DataType.TEXT),
                        Property(name="documentId", data_type=DataType.TEXT),
                        Property(name="text", data_type=DataType.TEXT),
                        Property(name="metadata", data_type=DataType.OBJECT),
                    ]
                )
                
                logger.info(f"Created collection: {collection_name}")
                
        except Exception as e:
            logger.error(f"Error creating schema: {e}")
            raise
        
    async def search_hybrid(
        self,
        collection_name: str,
        query: str,
        userId: str,
        embedding: List[float],
        top_k: int = 10,
        documentIds: Optional[List[str]] = None,
    ) -> List[Any]:
        """Hybrid search using both query text and embedding, filtered by userId and optional documentIds"""
        try:
            self.create_schema({collection_name})  # Ensure collection exists
            collection = self.client.collections.get(collection_name)
            
            if documentIds:
                # Multiple filters combined with AND
                filters = (
                    weaviate.classes.query.Filter.by_property("userId").equal(userId) &
                    weaviate.classes.query.Filter.by_property("documentId").contains_any(documentIds)
                )
            else:
                # Single filter
                filters = weaviate.classes.query.Filter.by_property("userId").equal(userId)

            # Execute hybrid search
            response = collection.query.hybrid(
                query=query,
                vector=embedding,
                alpha=0.5,
                limit=top_k * 2,
                return_metadata=MetadataQuery(score=True),
                filters=filters
            )
            
            logger.info(f"Response for question: {response}")

            unique_texts = set()
            results = []

            for obj in response.objects:
                text = obj.properties.get("text", "").strip()
                if text and text not in unique_texts:
                    unique_texts.add(text)
                    results.append(obj)
                if len(results) >= top_k:
                    break

            return results
        
        except Exception as e:
            logger.error(f"Error performing hybrid search on {collection_name}: {e}")
            raise

    
    async def search_similar(
        self,
        collection_name: str,
        query_text: str,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            collection = self.client.collections.get(collection_name)
            
            # Build where filter if user_id is provided
            where_filter = None
            if user_id:
                where_filter = weaviate.classes.query.Filter.by_property("userId").equal(user_id)
            
            # Perform search
            response = collection.query.near_text(
                query=query_text,
                limit=limit,
                where=where_filter,
                return_metadata=MetadataQuery(score=True, distance=True)
            )
            
            results = []
            for obj in response.objects:
                results.append({
                    "uuid": str(obj.uuid),
                    "properties": obj.properties,
                    "score": obj.metadata.score if obj.metadata else None,
                    "distance": obj.metadata.distance if obj.metadata else None
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching collection {collection_name}: {e}")
            raise

# Usage example
if __name__ == "__main__":
    collections = {"Regex_semantic"}
    
    try:
        # Initialize client
        db = VectorDBClient()
        
        # Reset and create schema
        db.reset_schema()
        db.create_schema(collections)
        
        logger.info("Weaviate setup completed successfully!")
        
    except Exception as e:
        logger.error(f"Setup failed: {e}")
    finally:
        # Always close the connection
        if 'db' in locals():
            db.close()
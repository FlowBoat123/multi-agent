from services.messageService import hybrid_retrieval
import os
import aiohttp
import json
from utils.logger import logger
from utils.vector_db import VectorDBClient
from utils.model import get_embedding

def segment(segment_text, format_ = "text"):
    from underthesea import word_tokenize
    return word_tokenize(segment_text, format_)

async def call_deepseek_api(prompt):
    """
    Gọi API Deepseek để sinh response từ prompt
    """
    try:
        deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        deepseek_api_url = os.getenv("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions")
        
        if not deepseek_api_key:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")
        
        headers = {
            "Authorization": f"Bearer {deepseek_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",  # hoặc model khác tùy theo API
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
            "stream": False
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(deepseek_api_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    error_text = await response.text()
                    logger.error(f"[DEEPSEEK] API Error {response.status}: {error_text}")
                    raise Exception(f"Deepseek API error: {response.status}")
                    
    except Exception as e:
        logger.error(f"[DEEPSEEK] Error calling API: {e}")
        raise

async def rag(data):
    logger.info(f"[RAG] Start RAG for data: {data}")
    vector_db = VectorDBClient()
    
    try:
        # Tiền xử lý truy vấn
        query_segmented = segment(data.get("message"))
        embedding = get_embedding(query_segmented)
        top_k = 10

        # Truy vấn hybrid search
        results = await hybrid_retrieval(
            query=query_segmented,
            embedding=embedding,
            userId=data.get("userId"),
            documentIds=data.get("documentIds") or None,  # Phải là list[str]
            collection_name=os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic"),
            vector_db=vector_db,
            top_k=top_k
        )
        
        if not results:
            return "Không tìm thấy tài liệu khớp với câu hỏi."
            
        # Tạo context từ retrieved documents
        context = "\n".join([doc.properties.get('text')
                        for doc in results[:top_k]])
        
        # Tạo prompt
        prompt = os.getenv("RESPONSE_PROMPT").replace("\\n", "\n")
        prompt = prompt.format(query=data.get("message"), context=context)

        logger.info(f"[RAG] Retrieved {len(results)} results")
        logger.info(f"[RAG] Sending prompt to Deepseek...")
        
        # Gọi Deepseek API để sinh response
        response = await call_deepseek_api(prompt)
        
        logger.info(f"[RAG] Received response from Deepseek: {response}")
        return response

    except Exception as e:
        logger.error(f"[RAG] Error during RAG process: {e}")
        raise
    finally:
        vector_db.close()
        logger.info("[RAG] VectorDB connection closed.")
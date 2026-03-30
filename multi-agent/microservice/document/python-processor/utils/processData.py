import uuid
from utils.model import get_embedding
from utils.loadData import format_chunk
from utils.enhanced_chunking import process_enhanced_semantic_data
from typing import List, Dict, Any, Optional

def segment(text):
    from underthesea import word_tokenize
    return word_tokenize(text, format="text")

CONVENTIONAL_CHUNKING = "Conventional_chunking"
SEMANTIC_CHUNKING = "Semantic_chunking"
ENHANCED_SEMANTIC_CHUNKING = "Enhanced_semantic_chunking"

def process_conventional_data(userId, documentId, corpus, chunker) -> List[Any]:
    objs = []
    seen_chunks = set()

    for doc in corpus:
        text = doc.get("text", "")
        doc_metadata = doc.get("metadata", {})
        
        try:
            chunks = chunker(segment(text))
            for chunk_index, chunk in enumerate(chunks):
                chunk_normalized = chunk.strip().lower()
                if chunk_normalized in seen_chunks:
                    continue
                seen_chunks.add(chunk_normalized)

                embedding_vector = get_embedding(chunk_normalized)
                
                # Enhanced metadata for conventional chunking
                enhanced_metadata = {
                    **doc_metadata,
                    'chunk_index': chunk_index,
                    'chunk_length': len(chunk_normalized),
                    'processing_method': 'conventional_chunking'
                }
                
                objs.append({
                    "documentId": documentId,
                    "userId": userId,
                    "metadata": enhanced_metadata,
                    "text": chunk_normalized,
                    "vector": embedding_vector
                })
        except Exception as e:
            print(f"⚠️ Error processing document {doc_metadata.get('file_name', 'Unknown')}: {e}")

    print(f"📊 Total chunks: {len(seen_chunks)}")
    return objs

def process_semantic_data(userId, documentId, corpus, chunker):
    """
    Updated process_semantic_data sử dụng direct coordinate extraction
    """
    from utils.model import get_embedding
    
    objs = []
    current_chunk = 0
    
    for doc in corpus:
        doc_metadata = doc.get('metadata', {})
        text_ = doc.get('text', '')
        
        print(f"Processing document: {doc_metadata.get('file_name', 'Unknown')}")
        
        # chunker trả về list of list -> flatten
        raw_chunks = chunker([text_])
        flattened = []
        for c in raw_chunks:
            if isinstance(c, list):
                flattened.extend(c)
            else:
                flattened.append(c)
        
        # Use direct coordinate extraction
        semantic_chunks, current_chunk = format_chunk(flattened, doc_metadata, current_chunk)
        
        for chunk in semantic_chunks:
            text_chunk = chunk.get('text', '')
            chunk_metadata = chunk.get('metadata', {})
            
            embedding_vector = get_embedding(text_chunk)
            
            objs.append({
                "documentId": documentId,
                "userId": userId,
                "metadata": chunk_metadata,
                "text": text_chunk,
                "vector": embedding_vector
            })
    
    print(f"Total processed chunks: {len(objs)}")
    coords_count = sum(1 for obj in objs if obj['metadata'].get('coordinates'))
    print(f"Chunks with coordinates: {coords_count}/{len(objs)}")
    
    return objs

async def process_data(userId, documentId, corpus, chunker, flag=SEMANTIC_CHUNKING, chunker_type="hybrid") -> List[Any]:
    if flag == CONVENTIONAL_CHUNKING:
        return process_conventional_data(userId, documentId, corpus, chunker)
    elif flag == SEMANTIC_CHUNKING:
        return process_semantic_data(userId, documentId, corpus, chunker)
    elif flag == ENHANCED_SEMANTIC_CHUNKING:
        return await process_enhanced_semantic_data(userId, documentId, corpus, chunker_type)
    else:
        raise ValueError(f"Unsupported chunking method: {flag}")
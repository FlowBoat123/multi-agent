# enhanced_chunking.py
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Tuple
import re
from utils.model import get_embedding

class EnhancedSemanticChunker:
    def __init__(self, model_name: str = "distiluse-base-multilingual-cased-v2"):
        self.model = SentenceTransformer(model_name)
        self.similarity_threshold = 0.7
        self.min_chunk_size = 100
        self.max_chunk_size = 1000
        
    def preprocess_text(self, text: str) -> str:
        """Tiền xử lý text trước khi chunking"""
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def sentence_split(self, text: str) -> List[str]:
        """Chia text thành các câu"""
        from underthesea import sent_tokenize
        sentences = sent_tokenize(text)
        return [s.strip() for s in sentences if s.strip()]
    
    def get_sentence_embeddings(self, sentences: List[str]) -> np.ndarray:
        """Tạo embeddings cho các câu"""
        return self.model.encode(sentences, convert_to_numpy=True)
    
    def calculate_similarity_scores(self, embeddings: np.ndarray) -> List[float]:
        """Tính điểm tương đồng giữa các câu liền kề"""
        similarities = []
        for i in range(len(embeddings) - 1):
            sim = cosine_similarity(
                embeddings[i].reshape(1, -1), 
                embeddings[i + 1].reshape(1, -1)
            )[0][0]
            similarities.append(sim)
        return similarities
    
    def find_breakpoints(self, similarities: List[float], sentences: List[str]) -> List[int]:
        """Tìm điểm ngắt dựa trên độ tương đồng"""
        breakpoints = [0]
        current_chunk_size = 0
        
        for i, sim in enumerate(similarities):
            sentence_len = len(sentences[i])
            current_chunk_size += sentence_len
            
            should_break = (
                sim < self.similarity_threshold or
                current_chunk_size > self.max_chunk_size
            )
            
            if should_break and current_chunk_size > self.min_chunk_size:
                breakpoints.append(i + 1)
                current_chunk_size = 0
        
        if breakpoints[-1] != len(sentences):
            breakpoints.append(len(sentences))
            
        return breakpoints
    
    def create_chunks_from_breakpoints(self, sentences: List[str], breakpoints: List[int]) -> List[str]:
        """Tạo chunks từ các điểm ngắt"""
        chunks = []
        for i in range(len(breakpoints) - 1):
            start_idx = breakpoints[i]
            end_idx = breakpoints[i + 1]
            chunk_sentences = sentences[start_idx:end_idx]
            chunk_text = ' '.join(chunk_sentences)
            if chunk_text.strip():
                chunks.append(chunk_text.strip())
        return chunks
    
    def semantic_chunking(self, text: str) -> List[str]:
        """Thực hiện semantic chunking chính"""
        text = self.preprocess_text(text)
        
        if len(text) < self.min_chunk_size:
            return [text]
        
        sentences = self.sentence_split(text)
        if len(sentences) <= 1:
            return [text]
        
        embeddings = self.get_sentence_embeddings(sentences)
        similarities = self.calculate_similarity_scores(embeddings)
        breakpoints = self.find_breakpoints(similarities, sentences)
        chunks = self.create_chunks_from_breakpoints(sentences, breakpoints)
        
        return chunks

class HybridSemanticChunker:
    """Kết hợp nhiều phương pháp chunking"""
    
    def __init__(self, model_name: str = "distiluse-base-multilingual-cased-v2"):
        self.semantic_chunker = EnhancedSemanticChunker(model_name)
        self.model = SentenceTransformer(model_name)
    
    def structure_aware_chunking(self, text: str) -> List[str]:
        """Chunking có nhận biết cấu trúc văn bản"""
        chunks = []
        paragraphs = text.split('\n\n')
        
        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
                
            if len(paragraph) > self.semantic_chunker.max_chunk_size:
                sub_chunks = self.semantic_chunker.semantic_chunking(paragraph)
                chunks.extend(sub_chunks)
            else:
                chunks.append(paragraph.strip())
        
        return chunks
    
    def overlap_chunking(self, chunks: List[str], overlap_ratio: float = 0.1) -> List[str]:
        """Thêm overlap giữa các chunks"""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = [chunks[0]]
        
        for i in range(1, len(chunks)):
            prev_chunk = chunks[i-1]
            current_chunk = chunks[i]
            
            prev_words = prev_chunk.split()
            overlap_size = int(len(prev_words) * overlap_ratio)
            
            if overlap_size > 0:
                overlap_text = ' '.join(prev_words[-overlap_size:])
                overlapped_chunk = overlap_text + ' ' + current_chunk
                overlapped_chunks.append(overlapped_chunk)
            else:
                overlapped_chunks.append(current_chunk)
        
        return overlapped_chunks
    
    def chunk_with_context(self, text: str, add_overlap: bool = True) -> List[str]:
        """Chunking với context và overlap"""
        initial_chunks = self.structure_aware_chunking(text)
        
        refined_chunks = []
        for chunk in initial_chunks:
            if len(chunk) > self.semantic_chunker.max_chunk_size * 1.5:
                sub_chunks = self.semantic_chunker.semantic_chunking(chunk)
                refined_chunks.extend(sub_chunks)
            else:
                refined_chunks.append(chunk)
        
        if add_overlap:
            refined_chunks = self.overlap_chunking(refined_chunks)
        
        return refined_chunks

# Factory functions
def get_enhanced_chunker():
    return EnhancedSemanticChunker()

def get_hybrid_chunker():
    return HybridSemanticChunker()

# Import segment function từ formatChunk
def segment(segment_text, format_="text"):
    from underthesea import word_tokenize
    return word_tokenize(segment_text, format_)

# Processing function với metadata format chuẩn
async def process_enhanced_semantic_data(userId, documentId, corpus, chunker_type="hybrid"):
    """Process data với enhanced semantic chunking và metadata format chuẩn"""
    objs = []
    
    # Chọn chunker
    chunker_map = {
        "hybrid": (get_hybrid_chunker(), "chunk_with_context"),
    }
    
    if chunker_type not in chunker_map:
        chunker_type = "hybrid"
    
    chunker, method_name = chunker_map[chunker_type]
    
    for doc in corpus:
        doc_metadata = doc.get('metadata', {})
        text = doc.get('text', '')
        
        if not text.strip():
            continue
        
        try:
            # Thực hiện chunking
            if method_name:  # Enhanced hoặc Hybrid
                chunks = getattr(chunker, method_name)(text)
            else:  # Statistical hoặc Cumulative
                chunks = chunker([text])
                if chunks and hasattr(chunks[0], 'splits'):
                    chunks = [' '.join(chunk.splits) for chunk in chunks]
            
            # Format chunks với metadata giống formatChunk.py
            formatted_chunks = format_enhanced_chunks(chunks, doc_metadata)
            
            for formatted_chunk in formatted_chunks:
                chunk_text = formatted_chunk.get('text', '')
                chunk_metadata = formatted_chunk.get('metadata', {})
                
                if not chunk_text.strip():
                    continue
                
                embedding_vector = get_embedding(chunk_text)
                
                # Thêm processing method vào metadata
                chunk_metadata['processing_method'] = f'enhanced_semantic_{chunker_type}'
                
                objs.append({
                    "documentId": documentId,
                    "userId": userId,
                    "metadata": chunk_metadata,
                    "text": chunk_text,
                    "vector": embedding_vector
                })
                
        except Exception as e:
            print(f"❌ Error processing document {doc_metadata.get('file_name', 'Unknown')}: {e}")
    
    print(f"📊 Total enhanced semantic chunks: {len(objs)}")
    return objs

def format_enhanced_chunks(chunks, document_metadata=None):
    """
    Format chunks với position tracking như trong formatChunk.py
    Hỗ trợ multiple chunk object types
    """
    objs = []
    total_processed_length = 0
    current_page = None
    current_chunk = 0
    
    for chunk_index, chunk in enumerate(chunks):
        # Detect text depending on chunk type
        if isinstance(chunk, str):
            chunk_text = chunk
        elif isinstance(chunk, dict) and "text" in chunk:
            chunk_text = chunk["text"]
        elif hasattr(chunk, "text"):
            chunk_text = chunk.text
        elif hasattr(chunk, "splits"):
            chunk_text = " ".join(chunk.splits)
        else:
            # Fallback: convert to string
            chunk_text = str(chunk)
        
        # Word segmentation
        text_ = segment(chunk_text)
        
        page_number = document_metadata.get('page_number', 0) if document_metadata else 0
        if page_number != current_page:
            current_page = page_number
            total_processed_length = 0  # reset khi sang page mới
        
        # Calculate positions
        start_position = total_processed_length
        end_position = start_position + len(chunk_text)
        
        # Metadata tracking giống formatChunk.py
        chunk_metadata = {
            'chunk_index': current_chunk,
        }
        
        # Merge với document metadata nếu có
        if document_metadata:
            chunk_metadata.update({
                'file_name': document_metadata.get('file_name'),
                'source': document_metadata.get('source'),
                'page_number': document_metadata.get('page_number', 0),
                'minio_path': document_metadata.get('minio_path'),
                'document_id': document_metadata.get('document_id'),
                'total_length': document_metadata.get('total_length')
            })
        
        objs.append({
            'metadata': chunk_metadata,
            'text': text_
        })
        
        current_chunk += 1
        
        # Update cho chunk tiếp theo
        total_processed_length = end_position
    
    return objs
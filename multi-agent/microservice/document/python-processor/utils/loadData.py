import os
import fitz  # PyMuPDF
import re
from typing import List, Dict, Any, Optional
from docx import Document  # ✅ thêm để đọc .docx

def process_file(file_path):
    """
    Process file using PyMuPDF for PDF, python-docx cho DOCX và standard TextLoader cho text files
    """
    lower_path = file_path.lower()
    if lower_path.endswith(".pdf"):
        return process_pdf_with_coordinates(file_path)
    elif lower_path.endswith(".txt"):
        return process_text_file(file_path)
    elif lower_path.endswith(".docx"):
        return process_docx_file(file_path)  # ✅ xử lý docx
    elif lower_path.endswith(".doc"):
        return process_doc_file(file_path)
    else:
        print(f"⚠️ Định dạng file không hỗ trợ: {file_path}")
        return []

def process_doc_file(file_path):
    """
    Process .doc file (Word cũ) using textract
    (Không có tọa độ, giống text thuần)
    """
    try:
        import textract  # import trong hàm để tránh lỗi nếu chưa cài

        raw = textract.process(file_path)  # bytes
        content = raw.decode("utf-8", errors="ignore")

        return [{
            "page_content": content,
            "metadata": {
                "source": file_path,
                "page": 0,
                "file_size": len(content),
                "file_type": "doc",
                "char_positions": [],  # Không có toạ độ cho doc
                "total_chars": len(content)
            }
        }]
    except ImportError:
        print("❌ Chưa cài textract. Vui lòng chạy: pip install textract")
        return []
    except Exception as e:
        print(f"❌ Lỗi khi xử lý file DOC {file_path}: {str(e)}")
        return []

def process_text_file(file_path):
    """
    Process text file (fallback for non-PDF files)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        return [{
            "page_content": content,
            "metadata": {
                "source": file_path,
                "page": 0,
                "file_size": len(content),
                "file_type": "text",
                "char_positions": [],  # Empty for text files
                "total_chars": len(content)
            }
        }]
        
    except Exception as e:
        print(f"❌ Lỗi khi xử lý file text {file_path}: {str(e)}")
        return []

def process_docx_file(file_path):
    """
    Process .docx file using python-docx
    (Không có toạ độ như PDF, xử lý giống text thuần)
    """
    try:
        doc = Document(file_path)
        # Ghép nội dung các đoạn
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        content = "\n".join(paragraphs)

        return [{
            "page_content": content,
            "metadata": {
                "source": file_path,
                "page": 0,
                "file_size": len(content),
                "file_type": "docx",
                "char_positions": [],  # Không có toạ độ cho docx
                "total_chars": len(content)
            }
        }]
    except Exception as e:
        print(f"❌ Lỗi khi xử lý file DOCX {file_path}: {str(e)}")
        return []

def process_pdf_with_coordinates(file_path):
    """
    Process PDF using PyMuPDF to extract text with coordinate information
    """
    documents = []
    
    try:
        pdf_document = fitz.open(file_path)
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Lấy text với thông tin tọa độ chi tiết
            text_dict = page.get_text("dict")
            page_text = page.get_text()
            
            # Tạo character-to-coordinate mapping
            char_positions = []
            current_char_index = 0
            
            for block in text_dict["blocks"]:
                if "lines" in block:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            span_text = span["text"]
                            span_bbox = span["bbox"]  # [x0, y0, x1, y1]
                            
                            # Ước tính tọa độ cho từng ký tự trong span
                            char_width = (span_bbox[2] - span_bbox[0]) / len(span_text) if span_text else 0
                            
                            for char_idx, char in enumerate(span_text):
                                char_x0 = span_bbox[0] + (char_idx * char_width)
                                char_x1 = char_x0 + char_width
                                
                                char_positions.append({
                                    'char': char,
                                    'global_index': current_char_index,
                                    'coordinates': {
                                        'x0': char_x0,
                                        'y0': span_bbox[1],
                                        'x1': char_x1,
                                        'y1': span_bbox[3]
                                    },
                                    'span_info': {
                                        'font': span.get("font", ""),
                                        'size': span.get("size", 0),
                                        'flags': span.get("flags", 0),
                                        'color': span.get("color", 0)
                                    }
                                })
                                current_char_index += 1
            
            # Tạo document object với metadata mở rộng
            doc_metadata = {
                "source": file_path,
                "page": page_num,
                "page_size": {
                    "width": page.rect.width,
                    "height": page.rect.height
                },
                "char_positions": char_positions,  # Mapping từ character index đến tọa độ
                "total_chars": len(char_positions)
            }
            
            documents.append({
                "page_content": page_text,
                "metadata": doc_metadata
            })
        
        pdf_document.close()
        
    except Exception as e:
        print(f"❌ Lỗi khi xử lý PDF {file_path}: {str(e)}")
        return []
    
    return documents

def process_text_file(file_path):
    """
    Process text file (fallback for non-PDF files)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        return [{
            "page_content": content,
            "metadata": {
                "source": file_path,
                "page": 0,
                "file_size": len(content),
                "file_type": "text",
                "char_positions": []  # Empty for text files
            }
        }]
        
    except Exception as e:
        print(f"❌ Lỗi khi xử lý file text {file_path}: {str(e)}")
        return []

async def loadData(path, document_id=None):
    """
    Load data with enhanced metadata including coordinate information
    """
    docs = []
    file_name = os.path.basename(path) if os.path.isfile(path) else None

    if os.path.isfile(path):
        docs.extend(process_file(path))

    elif os.path.isdir(path):
        for file in os.listdir(path):
            file_path = os.path.join(path, file)
            if os.path.isfile(file_path):
                docs.extend(process_file(file_path))

    content = []
    for doc in docs:
        # Enhanced metadata with coordinate information
        source_path = doc["metadata"].get("source", "")
        page_number = doc["metadata"].get("page", 0)
        
        enhanced_metadata = {
            "source": source_path,
            "document_id": document_id,
            "file_name": file_name or os.path.basename(source_path),
            "page_number": page_number,
            "total_length": len(doc["page_content"]),
            "minio_path": f"user{document_id.split('_')[0] if document_id else ''}/{file_name}" if file_name else None,
            # Thông tin tọa độ từ PyMuPDF
            "page_size": doc["metadata"].get("page_size", {}),
            "char_positions": doc["metadata"].get("char_positions", []),
            "total_chars": doc["metadata"].get("total_chars", 0),
            "coordinate_support": len(doc["metadata"].get("char_positions", [])) > 0
        }
        
        content.append({
            "source": source_path,
            "text": doc["page_content"],
            "metadata": enhanced_metadata,
            "page_number": page_number
        })

    if not content:
        print(f"❌ Không tìm thấy tài liệu nào trong đường dẫn: {path}")
        raise FileExistsError(f"❌ Không tìm thấy tài liệu nào trong đường dẫn: {path}")
    
    return content


# formatChunk.py - Updated with coordinate mapping
def segment(segment_text, format_="text"):
    from underthesea import word_tokenize
    return word_tokenize(segment_text, format_)

def format_chunk(chunks, document_metadata=None, current_chunk=0):
    """
    Format chunks và lấy coordinates trực tiếp từ PDF
    """
    from underthesea import word_tokenize
    
    objs = []
    file_path = document_metadata.get('source') if document_metadata else None
    
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
            raise ValueError(f"Unsupported chunk format: {type(chunk)}")

        # Word segmentation
        text_ = word_tokenize(chunk_text, format="text")
        
        # Extract coordinates directly from PDF
        coordinates = None
        if file_path and document_metadata:
            page_number = document_metadata.get('page_number', 0)
        
        # Create metadata
        chunk_metadata = {
            'chunk_index': current_chunk,
        }

        # Merge with document metadata if available
        if document_metadata:
            chunk_metadata.update({
                'file_name': document_metadata.get('file_name'),
                'source': document_metadata.get('source'),
                'page_number': document_metadata.get('page_number', 0),
                'minio_path': document_metadata.get('minio_path'),
                'page_size': document_metadata.get('page_size', {}),
            })

        current_chunk += 1
        
        objs.append({
            'metadata': chunk_metadata,
            'text': text_
        })

    print(f"Processed {len(objs)} chunks with direct coordinate extraction")
    coords_count = sum(1 for obj in objs if obj['metadata'].get('coordinates'))
    print(f"Chunks with coordinates: {coords_count}/{len(objs)}")
    
    return objs, current_chunk

def position_to_coordinates(start_pos, end_pos, char_positions):
    """
    ✅ IMPROVED: Better coordinate conversion with error handling
    """
    if not char_positions:
        print("❌ position_to_coordinates: No char_positions provided")
        return None
    
    if start_pos >= len(char_positions):
        print(f"❌ position_to_coordinates: start_pos {start_pos} >= len(char_positions) {len(char_positions)}")
        return None
    
    try:
        # Get coordinates of first character
        start_char = char_positions[min(start_pos, len(char_positions) - 1)]
        # Get coordinates of last character (with bounds checking)
        end_char = char_positions[min(end_pos - 1, len(char_positions) - 1)]
        
        # Create bounding box around entire chunk
        coordinates = {
            'x0': start_char['coordinates']['x0'],
            'y0': min(start_char['coordinates']['y0'], end_char['coordinates']['y0']),
            'x1': end_char['coordinates']['x1'],
            'y1': max(start_char['coordinates']['y1'], end_char['coordinates']['y1']),
            'bbox': [
                start_char['coordinates']['x0'],
                min(start_char['coordinates']['y0'], end_char['coordinates']['y0']),
                end_char['coordinates']['x1'],
                max(start_char['coordinates']['y1'], end_char['coordinates']['y1'])
            ]
        }
        
        print(f"✅ Converted position {start_pos}-{end_pos} to bbox: {coordinates['bbox']}")
        return coordinates
        
    except Exception as e:
        print(f"❌ Error in position_to_coordinates: {e}")
        return None

# Utility functions để làm việc với coordinates
def get_chunk_bbox(chunk_obj):
    """
    Lấy bounding box của chunk
    """
    coordinates = chunk_obj.get('metadata', {}).get('coordinates')
    if coordinates:
        return coordinates.get('bbox')
    return None

def extract_text_by_chunk_coordinates(file_path, chunk_obj, page_num=None):
    """
    Trích xuất text từ PDF dựa trên tọa độ của chunk
    """
    coordinates = chunk_obj.get('metadata', {}).get('coordinates')
    if not coordinates:
        return ""
    
    page_number = page_num or chunk_obj.get('metadata', {}).get('page_number', 0)
    
    try:
        pdf_document = fitz.open(file_path)
        
        if page_number >= len(pdf_document):
            return ""
        
        page = pdf_document[page_number]
        bbox = coordinates['bbox']
        rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
        
        text = page.get_text("text", clip=rect)
        pdf_document.close()
        
        return text.strip()
        
    except Exception as e:
        print(f"❌ Lỗi khi trích xuất text từ coordinates: {str(e)}")
        return ""

def visualize_chunk_location(file_path, chunk_obj, output_path=None):
    """
    Tạo image highlight vị trí của chunk trong PDF
    """
    coordinates = chunk_obj.get('metadata', {}).get('coordinates')
    if not coordinates:
        print("❌ Chunk không có thông tin coordinates")
        return None
    
    page_number = chunk_obj.get('metadata', {}).get('page_number', 0)
    
    try:
        pdf_document = fitz.open(file_path)
        page = pdf_document[page_number]
        
        # Tạo highlight rectangle
        bbox = coordinates['bbox']
        rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
        
        # Highlight với màu vàng
        highlight = page.add_highlight_annot(rect)
        highlight.set_colors(stroke=[1, 1, 0])  # Yellow
        highlight.update()
        
        # Render page as image
        pix = page.get_pixmap()
        
        if output_path:
            pix.save(output_path)
            print(f"✅ Đã lưu visualization tại: {output_path}")
        
        pdf_document.close()
        return pix
        
    except Exception as e:
        print(f"❌ Lỗi khi tạo visualization: {str(e)}")
        return None
    
def extract_chunk_coordinates_from_pdf(file_path: str, page_num: int, chunk_text: str) -> Optional[Dict]:
    """
    Trích xuất tọa độ trực tiếp của chunk text từ PDF
    
    Args:
        file_path: Đường dẫn file PDF
        page_num: Số trang
        chunk_text: Nội dung text của chunk
    
    Returns:
        Dict chứa coordinate information hoặc None
    """
    try:
        pdf_document = fitz.open(file_path)
        
        if page_num >= len(pdf_document):
            return None
            
        page = pdf_document[page_num]
        
        # Clean chunk text để search
        clean_chunk_text = clean_text_for_search(chunk_text)
        
        # Method 1: Search exact text
        coordinates = search_text_coordinates(page, clean_chunk_text)
        
        if not coordinates:
            # Method 2: Search partial text (first few words)
            words = clean_chunk_text.split()
            if len(words) > 3:
                partial_text = " ".join(words[:3])  # First 3 words
                coordinates = search_text_coordinates(page, partial_text)
        
        if not coordinates:
            # Method 3: Search with fuzzy matching
            coordinates = fuzzy_search_coordinates(page, clean_chunk_text)
        
        pdf_document.close()
        return coordinates
        
    except Exception as e:
        print(f"Error extracting chunk coordinates: {e}")
        return None

def clean_text_for_search(text: str) -> str:
    """
    Clean text để dễ search trong PDF
    """
    # Remove word tokenization artifacts
    text = re.sub(r'_', ' ', text)  # underthesea thêm _
    text = re.sub(r'\s+', ' ', text)  # Multiple spaces -> single space
    text = text.strip()
    
    # Take first reasonable portion for search
    words = text.split()
    if len(words) > 20:
        text = " ".join(words[:20])  # First 20 words
    
    return text

def search_text_coordinates(page, search_text: str) -> Optional[Dict]:
    """
    Search text và lấy coordinates từ PDF page
    """
    try:
        # Search text instances
        text_instances = page.search_for(search_text)
        
        if text_instances:
            # Get first match (có thể có nhiều matches)
            rect = text_instances[0]  # fitz.Rect object
            
            coordinates = {
                'x0': rect.x0,
                'y0': rect.y0, 
                'x1': rect.x1,
                'y1': rect.y1,
                'bbox': [rect.x0, rect.y0, rect.x1, rect.y1],
                'search_method': 'exact_search',
                'matches_found': len(text_instances)
            }
            
            print(f"Found exact match: bbox={coordinates['bbox']}")
            return coordinates
            
    except Exception as e:
        print(f"Error in exact search: {e}")
    
    return None

def fuzzy_search_coordinates(page, chunk_text: str) -> Optional[Dict]:
    """
    Fuzzy search khi exact search không tìm thấy
    """
    try:
        # Get all text blocks from page
        blocks = page.get_text("dict")["blocks"]
        
        chunk_words = set(chunk_text.lower().split())
        best_match = None
        best_score = 0
        
        for block in blocks:
            if "lines" in block:
                block_text = ""
                block_bbox = None
                
                # Combine all text in block
                for line in block["lines"]:
                    for span in line["spans"]:
                        block_text += span.get("text", "") + " "
                
                # Calculate similarity
                block_words = set(block_text.lower().split())
                common_words = len(chunk_words.intersection(block_words))
                score = common_words / max(len(chunk_words), 1)
                
                if score > best_score and score > 0.3:  # Threshold 30%
                    best_score = score
                    # Calculate block bbox
                    block_bbox = block.get("bbox")
                    best_match = {
                        'x0': block_bbox[0],
                        'y0': block_bbox[1],
                        'x1': block_bbox[2], 
                        'y1': block_bbox[3],
                        'bbox': list(block_bbox),
                        'search_method': 'fuzzy_search',
                        'similarity_score': score
                    }
        
        if best_match:
            print(f"Found fuzzy match: score={best_score:.2f}, bbox={best_match['bbox']}")
            
        return best_match
        
    except Exception as e:
        print(f"Error in fuzzy search: {e}")
        return None

def get_chunk_coordinates_by_content(file_path: str, chunks_with_metadata: List[Dict]) -> List[Dict]:
    """
    Lấy coordinates cho tất cả chunks dựa trên content
    
    Args:
        file_path: Đường dẫn PDF
        chunks_with_metadata: List các chunks đã có metadata
    
    Returns:
        List chunks với coordinates được cập nhật
    """
    updated_chunks = []
    
    for chunk_obj in chunks_with_metadata:
        chunk_text = chunk_obj.get('text', '')
        metadata = chunk_obj.get('metadata', {})
        page_number = metadata.get('page_number', 0)
        
        # Extract coordinates từ PDF
        coordinates = extract_chunk_coordinates_from_pdf(file_path, page_number, chunk_text)
        
        # Update metadata
        updated_metadata = {
            **metadata,
            'coordinates': coordinates,
            'has_coordinates': coordinates is not None,
            'coordinate_method': coordinates.get('search_method') if coordinates else 'failed'
        }
        
        updated_chunks.append({
            'text': chunk_text,
            'metadata': updated_metadata
        })
        
        # Debug info
        if coordinates:
            print(f"Chunk {metadata.get('chunk_index', '?')}: Found coordinates {coordinates['bbox']}")
        else:
            print(f"Chunk {metadata.get('chunk_index', '?')}: No coordinates found")
    
    return updated_chunks
def segment(segment_text, format_ = "text"):
    from underthesea import word_tokenize
    return word_tokenize(segment_text, format_)

def format_chunk(chunks, document_metadata=None):
    """
    Format chunks with position tracking for retrieval
    Support multiple chunk object types (string, dict, object with .text or .splits)
    """
    objs = []
    total_processed_length = 0
    current_page = None  # reset page tracking

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
        text_ = segment(chunk_text)

        page_number = document_metadata.get('page_number', 0) if document_metadata else 0
        if page_number != current_page:
            current_page = page_number
            total_processed_length = 0  # reset khi sang page mới

        # Calculate positions
        start_position = total_processed_length
        end_position = start_position + len(chunk_text)

        # Metadata tracking
        chunk_metadata = {
            'chunk_index': chunk_index,
            'start_position': start_position,
            'end_position': end_position,
            'chunk_length': len(chunk_text),
        }

        # Merge with document metadata if available
        if document_metadata:
            chunk_metadata.update({
                'file_name': document_metadata.get('file_name'),
                'source': document_metadata.get('source'),
                'page_number': document_metadata.get('page_number', 0),
                'minio_path': document_metadata.get('minio_path')
            })

        objs.append({
            'metadata': chunk_metadata,
            'text': text_
        })

        # Update for next chunk
        total_processed_length = end_position

    return objs

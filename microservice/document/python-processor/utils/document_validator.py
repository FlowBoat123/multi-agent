from typing import Dict, Any, List
import os

class DocumentValidator:
    """Utility class for document validation"""
    
    @staticmethod
    def validate_file_size(file_path: str, max_size_mb: int = 100) -> bool:
        """Validate file size"""
        if not os.path.exists(file_path):
            return False
        
        file_size = os.path.getsize(file_path)
        max_size_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_size_bytes
    
    @staticmethod
    def validate_file_extension(file_name: str, allowed_extensions: List[str] = None) -> bool:
        """Validate file extension"""
        if allowed_extensions is None:
            allowed_extensions = ['.pdf', '.txt', '.doc', '.docx', '.md']
        
        file_ext = os.path.splitext(file_name)[1].lower()
        return file_ext in allowed_extensions
    
    @staticmethod
    def validate_document_data(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
        """Validate document data and return sanitized version"""
        if not isinstance(data, dict):
            raise ValueError("Data must be a dictionary")
        
        # Check required fields
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Sanitize strings
        sanitized_data = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized_data[key] = value.strip()
            else:
                sanitized_data[key] = value
        
        return sanitized_data
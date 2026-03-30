"""
Script để test hệ thống RAG với test set và lưu kết quả
"""
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from src.main import run

async def run_evaluation(test_file_path: str, num_samples: int = 2, output_dir: str = "results"):
    """
    Chạy evaluation trên test set
    
    Args:
        test_file_path: Đường dẫn đến file test set JSON
        num_samples: Số lượng mẫu cần test (mặc định 20)
        output_dir: Thư mục lưu kết quả
    """
    # Tạo thư mục results nếu chưa có
    Path(output_dir).mkdir(exist_ok=True)
    
    # Đọc test set
    with open(test_file_path, 'r', encoding='utf-8') as f:
        test_data = json.load(f)
    
    # Lấy num_samples mẫu đầu tiên
    test_samples = test_data[:num_samples]
    
    print(f"Bắt đầu test {len(test_samples)} mẫu từ {test_file_path}")
    print("=" * 80)
    
    results = []
    
    for idx, sample in enumerate(test_samples, 1):
        question = sample["anchor"]
        expected_answer = sample["positive"]
        sample_id = sample["id"]
        level = sample["level"]
        
        print(f"\n[{idx}/{len(test_samples)}] Testing {sample_id} (Level {level})")
        print(f"Câu hỏi: {question}")
        
        try:
            # Gọi hệ thống RAG
            res = await run(
                question=question,
                conversation_id=sample_id
            )
            
            # Lấy kết quả
            actual_answer = res.get("response", "")
            validation_confidence = res.get("validation_confidence", 0.0)
            
            # Lấy thông tin search results (các đoạn được truy vấn)
            search_results = res.get("search_results", [])
            retrieved_chunks = []
            if search_results:
                for result in search_results:
                    chunk_info = {
                        "text": result.get("text", ""),
                        "score": result.get("metadata", {}).get("score", 0.0),
                        "file_name": result.get("metadata", {}).get("file_name", ""),
                        "page_number": result.get("metadata", {}).get("page_number", 0),
                        "chunk_index": result.get("metadata", {}).get("chunk_index", 0)
                    }
                    retrieved_chunks.append(chunk_info)
            
            # Lưu kết quả (chỉ những thông tin quan trọng)
            result = {
                "id": sample_id,
                "level": level,
                "question": question,
                "expected_answer": expected_answer,
                "actual_answer": actual_answer,
                "validation_confidence": validation_confidence,
                "retrieved_chunks": retrieved_chunks,
                "status": "success"
            }
            
            print(f"✓ Hoàn thành - Confidence: {validation_confidence}")
            
        except Exception as e:
            print(f"✗ Lỗi: {str(e)}")
            result = {
                "id": sample_id,
                "level": level,
                "question": question,
                "expected_answer": expected_answer,
                "actual_answer": "",
                "validation_confidence": 0.0,
                "retrieved_chunks": [],
                "status": "error",
                "error": str(e)
            }
        
        results.append(result)
    
    # Lưu kết quả vào file JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"evaluation_results_{timestamp}.json")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✓ Đã lưu kết quả vào: {output_file}")
    print(f"Tổng số mẫu đã test: {len(results)}")
    
    # Tính thống kê cơ bản
    success_count = sum(1 for r in results if r.get("status") == "success")
    error_count = len(results) - success_count
    
    print(f"\nThống kê:")
    print(f"  - Thành công: {success_count}/{len(results)}")
    print(f"  - Lỗi: {error_count}/{len(results)}")
    
    if success_count > 0:
        avg_confidence = sum(
            r.get("validation_confidence", 0) 
            for r in results if r.get("status") == "success"
        ) / success_count
        print(f"  - Độ tin cậy trung bình: {avg_confidence:.2f}")
    
    return output_file

async def main():
    # Đường dẫn đến file test set
    test_file = "test_set_ver1.json"  # hoặc đường dẫn đầy đủ
    
    # Chạy evaluation với 20 mẫu
    output_file = await run_evaluation(
        test_file_path=test_file,
        num_samples=2,
        output_dir="results"
    )
    
    print(f"\nFile kết quả: {output_file}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nĐã dừng bởi người dùng")

"""
Script đánh giá kết quả test bằng các metric khác nhau
"""
import json
import sys
from typing import List, Dict
import re
import os
import asyncio
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

def calculate_exact_match(expected: str, actual: str) -> float:
    """Exact match - so sánh chính xác"""
    return 1.0 if expected.strip().lower() == actual.strip().lower() else 0.0

def calculate_keyword_overlap(expected: str, actual: str) -> float:
    """Tính tỷ lệ từ khóa trùng khớp"""
    # Loại bỏ dấu câu và chuyển về lowercase
    expected_words = set(re.findall(r'\w+', expected.lower()))
    actual_words = set(re.findall(r'\w+', actual.lower()))
    
    if not expected_words:
        return 0.0
    
    overlap = expected_words.intersection(actual_words)
    return len(overlap) / len(expected_words)

def calculate_sentence_overlap(expected: str, actual: str) -> float:
    """Tính tỷ lệ câu/cụm từ trùng khớp"""
    # Tách thành các câu
    expected_sentences = [s.strip() for s in expected.split('.') if s.strip()]
    actual_sentences = [s.strip() for s in actual.split('.') if s.strip()]
    
    if not expected_sentences:
        return 0.0
    
    matches = 0
    for exp_sent in expected_sentences:
        for act_sent in actual_sentences:
            # Nếu câu expected xuất hiện trong actual (hoặc ngược lại)
            if exp_sent.lower() in act_sent.lower() or act_sent.lower() in exp_sent.lower():
                matches += 1
                break
    
    return matches / len(expected_sentences)

def calculate_containment(expected: str, actual: str) -> float:
    """Kiểm tra xem expected có được chứa trong actual không"""
    expected_clean = expected.strip().lower()
    actual_clean = actual.strip().lower()
    
    # Containment đơn giản
    if expected_clean in actual_clean:
        return 1.0
    
    # Partial containment - tính % các từ của expected xuất hiện trong actual
    expected_words = re.findall(r'\w+', expected_clean)
    actual_clean_text = actual_clean
    
    found_words = sum(1 for word in expected_words if word in actual_clean_text)
    return found_words / len(expected_words) if expected_words else 0.0

async def calculate_faithfulness(answer: str, retrieved_chunks: List[Dict]) -> float:
    """
    Faithfulness: Đánh giá mức độ trung thực của câu trả lời so với context được truy vấn
    Score cao = câu trả lời được hỗ trợ bởi context, không bịa đặt
    """
    if not answer or not retrieved_chunks:
        return 0.0
    
    # Tạo context từ retrieved chunks
    context = "\n\n".join([chunk.get("text", "") for chunk in retrieved_chunks[:5]])  # Top 5 chunks
    
    prompt = f"""Đánh giá mức độ TRUNG THỰC của câu trả lời dựa trên context được cung cấp.

CONTEXT (từ tài liệu):
{context}

CÂU TRÁ LỜI:
{answer}

Hãy đánh giá:
1. Mọi thông tin trong câu trả lời có được hỗ trợ bởi context không?
2. Có thông tin nào bị bịa đặt, suy luận sai, hoặc không có trong context không?

Cho điểm từ 0.0 đến 1.0:
- 1.0: Tất cả thông tin đều có trong context, hoàn toàn trung thực
- 0.7-0.9: Phần lớn trung thực, có thể có paraphrase nhẹ
- 0.4-0.6: Một số thông tin không có trong context
- 0.0-0.3: Nhiều thông tin sai lệch hoặc bịa đặt

Chỉ trả về 1 số thực từ 0.0 đến 1.0, không giải thích."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 10
                }
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"].strip()
            score = float(re.search(r'0?\.\d+|1\.0|[01]', score_text).group())
            return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Error calculating faithfulness: {e}")
        return 0.0

async def calculate_answer_relevancy(question: str, answer: str) -> float:
    """
    Answer Relevancy: Đánh giá mức độ liên quan của câu trả lời với câu hỏi
    Score cao = câu trả lời trực tiếp, đúng trọng tâm
    """
    if not answer or not question:
        return 0.0
    
    prompt = f"""Đánh giá mức độ LIÊN QUAN của câu trả lời với câu hỏi.

CÂU HỎI:
{question}

CÂU TRÁ LỜI:
{answer}

Hãy đánh giá:
1. Câu trả lời có trả lời ĐÚNG câu hỏi không?
2. Câu trả lời có đi chệch hướng, nói lan man không?
3. Thông tin có đủ để trả lời câu hỏi không?

Cho điểm từ 0.0 đến 1.0:
- 1.0: Trả lời TRỰC TIẾP, đầy đủ, đúng trọng tâm
- 0.7-0.9: Có trả lời nhưng hơi lan man hoặc thiếu chi tiết
- 0.4-0.6: Trả lời không rõ ràng hoặc chỉ một phần
- 0.0-0.3: Không liên quan hoặc trả lời sai hướng

Chỉ trả về 1 số thực từ 0.0 đến 1.0, không giải thích."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 10
                }
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"].strip()
            score = float(re.search(r'0?\.\d+|1\.0|[01]', score_text).group())
            return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Error calculating answer relevancy: {e}")
        return 0.0

async def calculate_context_precision(question: str, retrieved_chunks: List[Dict], expected_answer: str) -> float:
    """
    Context Precision: Đánh giá chất lượng các đoạn context được retrieve
    Score cao = các đoạn context có liên quan và hữu ích cho câu hỏi
    """
    if not retrieved_chunks or not question:
        return 0.0
    
    # Lấy top 5 chunks để đánh giá
    top_chunks = retrieved_chunks[:5]
    context_text = "\n\n---\n\n".join([
        f"Chunk {i+1} (Score: {chunk.get('score', 0):.3f}):\n{chunk.get('text', '')[:500]}"
        for i, chunk in enumerate(top_chunks)
    ])
    
    prompt = f"""Đánh giá chất lượng các ĐOẠN CONTEXT được truy vấn cho câu hỏi.

CÂU HỎI:
{question}

CÂU TRẢ LỜI MONG ĐỢI:
{expected_answer}

CÁC ĐOẠN CONTEXT ĐƯỢC TÌM:
{context_text}

Hãy đánh giá:
1. Các đoạn context có chứa thông tin cần thiết để trả lời câu hỏi không?
2. Các đoạn context có liên quan đúng chủ đề không?
3. Thứ tự ưu tiên (ranking) của các chunks có hợp lý không?

Cho điểm từ 0.0 đến 1.0:
- 1.0: Context hoàn hảo, chứa đầy đủ thông tin cần thiết
- 0.7-0.9: Context tốt, có thông tin liên quan
- 0.4-0.6: Context có một phần liên quan
- 0.0-0.3: Context không liên quan hoặc thiếu thông tin quan trọng

Chỉ trả về 1 số thực từ 0.0 đến 1.0, không giải thích."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 10
                }
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"].strip()
            score = float(re.search(r'0?\.\d+|1\.0|[01]', score_text).group())
            return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Error calculating context precision: {e}")
        return 0.0

async def calculate_context_recall(expected_answer: str, retrieved_chunks: List[Dict]) -> float:
    """
    Context Recall: Đánh giá khả năng retrieve đủ thông tin cần thiết
    Score cao = context chứa đầy đủ thông tin để trả lời câu hỏi expected
    """
    if not retrieved_chunks or not expected_answer:
        return 0.0
    
    # Tạo context từ retrieved chunks
    context = "\n\n".join([chunk.get("text", "") for chunk in retrieved_chunks])
    
    prompt = f"""Đánh giá khả năng RECALL (thu hồi) của context - liệu context có chứa đầy đủ thông tin cần thiết không?

CÂU TRẢ LỜI MONG ĐỢI (ground truth):
{expected_answer}

CONTEXT ĐÃ ĐƯỢC TÌM:
{context[:2000]}...

Hãy đánh giá:
1. Context có chứa ĐẦY ĐỦ thông tin cần thiết để tạo ra câu trả lời mong đợi không?
2. Có thông tin nào trong expected answer bị thiếu trong context không?
3. Nếu dùng context này, LLM có thể tạo ra câu trả lời đầy đủ không?

Cho điểm từ 0.0 đến 1.0:
- 1.0: Context chứa TẤT CẢ thông tin cần thiết
- 0.7-0.9: Context chứa hầu hết thông tin, thiếu vài chi tiết nhỏ
- 0.4-0.6: Context thiếu một số thông tin quan trọng
- 0.0-0.3: Context thiếu nhiều thông tin cốt lõi

Chỉ trả về 1 số thực từ 0.0 đến 1.0, không giải thích."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 10
                }
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"].strip()
            score = float(re.search(r'0?\.\d+|1\.0|[01]', score_text).group())
            return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Error calculating context recall: {e}")
        return 0.0

async def calculate_contextual_relevancy(question: str, retrieved_chunks: List[Dict]) -> float:
    """
    Contextual Relevancy: Đánh giá mức độ liên quan của context với câu hỏi
    Score cao = context trực tiếp liên quan đến câu hỏi, không có nhiễu
    """
    if not retrieved_chunks or not question:
        return 0.0
    
    # Đánh giá từng chunk
    context_items = []
    for i, chunk in enumerate(retrieved_chunks[:5], 1):  # Top 5 chunks
        context_items.append(f"[Chunk {i}] {chunk.get('text', '')[:300]}")
    
    context_text = "\n\n".join(context_items)
    
    prompt = f"""Đánh giá mức độ LIÊN QUAN của các đoạn context với câu hỏi.

CÂU HỎI:
{question}

CÁC ĐOẠN CONTEXT:
{context_text}

Hãy đánh giá:
1. Các đoạn context có TRỰC TIẾP liên quan đến câu hỏi không?
2. Có bao nhiêu % context là thông tin hữu ích (không phải nhiễu)?
3. Context có tập trung vào đúng chủ đề câu hỏi không?

Cho điểm từ 0.0 đến 1.0:
- 1.0: TẤT CẢ context đều trực tiếp liên quan và hữu ích
- 0.7-0.9: Phần lớn context liên quan, có ít nhiễu
- 0.4-0.6: Một nửa context liên quan, nhiều thông tin không cần thiết
- 0.0-0.3: Phần lớn context không liên quan hoặc off-topic

Chỉ trả về 1 số thực từ 0.0 đến 1.0, không giải thích."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 10
                }
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"].strip()
            score = float(re.search(r'0?\.\d+|1\.0|[01]', score_text).group())
            return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Error calculating contextual relevancy: {e}")
        return 0.0

async def evaluate_single_result(result: Dict) -> Dict:
    """Đánh giá một kết quả"""
    expected = result.get("expected_answer", "")
    actual = result.get("actual_answer", "")
    question = result.get("question", "")
    retrieved_chunks = result.get("retrieved_chunks", [])
    
    if not actual or result.get("status") != "success":
        return {
            "keyword_overlap": 0.0,
            "containment": 0.0,
            "faithfulness": 0.0,
            "answer_relevancy": 0.0,
            "context_precision": 0.0,
            "context_recall": 0.0,
            "contextual_relevancy": 0.0,
            "avg_score": 0.0
        }
    
    # Tính các metric cơ bản (synchronous)
    metrics = {
        "keyword_overlap": calculate_keyword_overlap(expected, actual),
        "containment": calculate_containment(expected, actual)
    }
    
    # Tính các metric sử dụng LLM (asynchronous)
    metrics["faithfulness"] = await calculate_faithfulness(actual, retrieved_chunks)
    metrics["answer_relevancy"] = await calculate_answer_relevancy(question, actual)
    metrics["context_precision"] = await calculate_context_precision(question, retrieved_chunks, expected)
    metrics["context_recall"] = await calculate_context_recall(expected, retrieved_chunks)
    metrics["contextual_relevancy"] = await calculate_contextual_relevancy(question, retrieved_chunks)
    
    # Tính điểm trung bình
    metrics["avg_score"] = sum(metrics.values()) / len(metrics)
    
    return metrics

async def evaluate_results_async(results_file: str):
    """Đánh giá toàn bộ kết quả test (async version)"""
    # Đọc file kết quả
    with open(results_file, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    print(f"Đánh giá kết quả từ: {results_file}")
    print("=" * 80)
    
    # Đánh giá từng kết quả
    evaluated_results = []
    for idx, result in enumerate(results, 1):
        print(f"Đang đánh giá {idx}/{len(results)}: {result.get('id', 'unknown')}...", end=" ")
        metrics = await evaluate_single_result(result)
        evaluated_result = {
            **result,
            "evaluation_metrics": metrics
        }
        evaluated_results.append(evaluated_result)
        print(f"✓ (Avg: {metrics['avg_score']:.3f})")
    
    return evaluated_results, results_file

def evaluate_results(results_file: str):
    """Wrapper để gọi async function"""
    evaluated_results, results_file = asyncio.run(evaluate_results_async(results_file))
    
    # Tính thống kê tổng hợp
    success_results = [r for r in evaluated_results if r.get("status") == "success"]
    
    if not success_results:
        print("Không có kết quả thành công nào để đánh giá!")
        return
    
    print(f"\nTổng số mẫu: {len(evaluated_results)}")
    print(f"Số mẫu thành công: {len(success_results)}")
    print(f"Tỷ lệ thành công: {len(success_results)/len(evaluated_results)*100:.1f}%")
    
    print("\n" + "-" * 80)
    print("ĐIỂM TRUNG BÌNH CÁC METRIC:")
    print("-" * 80)
    
    metrics_names = [
        "keyword_overlap", "containment",
        "faithfulness", "answer_relevancy", 
        "context_precision", "context_recall", "contextual_relevancy",
        "avg_score"
    ]
    for metric in metrics_names:
        values = [r["evaluation_metrics"][metric] for r in success_results]
        avg = sum(values) / len(values)
        print(f"  {metric:20s}: {avg:.3f} ({avg*100:.1f}%)")
    
    # Thống kê theo level
    print("\n" + "-" * 80)
    print("ĐIỂM TRUNG BÌNH THEO LEVEL:")
    print("-" * 80)
    
    levels = set(r["level"] for r in success_results)
    for level in sorted(levels):
        level_results = [r for r in success_results if r["level"] == level]
        avg_scores = [r["evaluation_metrics"]["avg_score"] for r in level_results]
        avg = sum(avg_scores) / len(avg_scores)
        print(f"  Level {level}: {avg:.3f} ({avg*100:.1f}%) - {len(level_results)} mẫu")
    
    # Thống kê validation confidence
    print("\n" + "-" * 80)
    print("THỐNG KÊ VALIDATION CONFIDENCE:")
    print("-" * 80)
    
    confidences = [r.get("validation_confidence", 0) for r in success_results]
    if confidences:
        avg_conf = sum(confidences) / len(confidences)
        min_conf = min(confidences)
        max_conf = max(confidences)
        print(f"  Trung bình: {avg_conf:.3f}")
        print(f"  Min: {min_conf:.3f}")
        print(f"  Max: {max_conf:.3f}")
    
    # Chi tiết 5 kết quả tốt nhất và 5 kết quả kém nhất
    print("\n" + "-" * 80)
    print("TOP 5 KẾT QUẢ TỐT NHẤT:")
    print("-" * 80)
    
    sorted_results = sorted(success_results, key=lambda x: x["evaluation_metrics"]["avg_score"], reverse=True)
    for i, result in enumerate(sorted_results[:5], 1):
        score = result["evaluation_metrics"]["avg_score"]
        print(f"\n{i}. [{result['id']}] Score: {score:.3f}")
        print(f"   Q: {result['question'][:100]}...")
        print(f"   Confidence: {result.get('validation_confidence', 0):.3f}")
    
    print("\n" + "-" * 80)
    print("TOP 5 KẾT QUẢ KÉM NHẤT:")
    print("-" * 80)
    
    for i, result in enumerate(sorted_results[-5:], 1):
        score = result["evaluation_metrics"]["avg_score"]
        print(f"\n{i}. [{result['id']}] Score: {score:.3f}")
        print(f"   Q: {result['question'][:100]}...")
        print(f"   Expected: {result['expected_answer'][:100]}...")
        print(f"   Actual: {result['actual_answer'][:100]}...")
    
    # Lưu kết quả đã đánh giá
    output_file = results_file.replace('.json', '_evaluated.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(evaluated_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 80}")
    print(f"✓ Đã lưu kết quả đánh giá vào: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python evaluate_results.py <đường_dẫn_file_kết_quả>")
        print("Ví dụ: python evaluate_results.py results/evaluation_results_20250117_120000.json")
        sys.exit(1)
    
    results_file = sys.argv[1]
    evaluate_results(results_file)

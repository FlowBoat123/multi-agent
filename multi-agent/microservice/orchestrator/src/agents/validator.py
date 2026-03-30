# agents/validator.py
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from src.state_type import AgentState
from src.publisher import publish_processing_event

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent

load_dotenv()


# ============================================================================
# LLM INSTANCE
# ============================================================================
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
    temperature=0
)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
def parse_json_response(content: str) -> Dict[str, Any]:
    """Parse JSON từ response của LLM."""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            return json.loads(json_str)
        raise ValueError(f"Không tìm thấy JSON hợp lệ trong response: {content}")


# ============================================================================
# SYSTEM PROMPT
# ============================================================================
VALIDATOR_SYSTEM_PROMPT = """Bạn là một hệ thống đánh giá chất lượng RAG (Retrieval-Augmented Generation).

NHIỆM VỤ:
1. Đọc câu hỏi của người dùng, kết quả tìm kiếm và ngữ cảnh hội thoại
2. Đánh giá xem thông tin đã đủ để trả lời câu hỏi chưa
3. Phân tích chất lượng kết quả tìm kiếm

TIÊU CHÍ ĐÁNH GIÁ:
✅ Thông tin ĐỦ khi:
- Có đủ dữ liệu để trả lời trực tiếp câu hỏi
- Các từ khóa quan trọng đều xuất hiện trong kết quả
- Kết quả có độ chi tiết hợp lý (không quá ngắn)
- Thông tin đáng tin cậy và liên quan

❌ Thông tin CHƯA ĐỦ khi:
- Thiếu dữ liệu quan trọng
- Kết quả không liên quan đến câu hỏi
- Kết quả quá chung chung, thiếu chi tiết
- Thiếu thông tin về các khía cạnh quan trọng

NẾU CHƯA ĐỦ:
- Xác định rõ THIẾU thông tin gì (cụ thể)
- Gợi ý cần tìm kiếm thêm gì
- Không nói chung chung kiểu "cần thêm thông tin"

OUTPUT:
Trả về JSON với format:
{
    "enough": true | false,
    "confidence": 0.0-1.0,
    "missing_info": ["thông tin cụ thể 1", "thông tin cụ thể 2", ...],
    "quality_assessment": "good" | "medium" | "poor",
    "reasoning": "Giải thích chi tiết"
}

VÍ DỤ 1 - ĐỦ:
Input:
- Câu hỏi: "Giá VNM hôm nay bao nhiêu?"
- Kết quả: ["VNM đóng cửa ở mức 85.5k, tăng 2.1% so với hôm qua"]

Output:
{
    "enough": true,
    "confidence": 0.95,
    "missing_info": [],
    "quality_assessment": "good",
    "reasoning": "Có đầy đủ thông tin về giá VNM hôm nay"
}

VÍ DỤ 2 - CHƯA ĐỦ:
Input:
- Câu hỏi: "So sánh hiệu suất VNM và VCB quý 3"
- Kết quả: ["VNM tăng trưởng doanh thu 15% quý 3"]

Output:
{
    "enough": false,
    "confidence": 0.3,
    "missing_info": [
        "Dữ liệu tài chính VCB quý 3",
        "Chỉ số lợi nhuận của cả 2 công ty",
        "So sánh ROE, ROA giữa VNM và VCB"
    ],
    "quality_assessment": "poor",
    "reasoning": "Chỉ có thông tin về VNM, thiếu hoàn toàn dữ liệu VCB để so sánh"
}
"""


# ============================================================================
# AGENT
# ============================================================================
validator_agent = create_agent(
    llm,
    system_prompt=VALIDATOR_SYSTEM_PROMPT,
    name="ValidatorAgent",
)


# ============================================================================
# NODE
# ============================================================================
async def validator_node(state: AgentState) -> AgentState:
    """
    Node đánh giá chất lượng kết quả tìm kiếm.
    
    Args:
        state: AgentState chứa câu hỏi, kết quả tìm kiếm và ngữ cảnh
        
    Returns:
        AgentState đã cập nhật với đánh giá validation
    """
    conversation_id = state.get("conversation_id", "")
    question = state.get("question", "")
    search_results = state.get("search_results", [])
    important_info = state.get("important_info", [])
    main_content = state.get("main_content", "")
    goal = state.get("goal", "")
    conversation_history = state.get("conversation_history", [])
    
    # # Publish event: Validation started
    # publish_processing_event(
    #     "validation.status",
    #     conversation_id,
    #     data={"status": "started", "stage": "validator"}
    # )
    
    # Extract text từ search results
    result_texts = []
    for r in search_results:
        if isinstance(r, dict):
            result_texts.append(r.get('text', ''))
        else:
            result_texts.append(str(r))
    
    combined_results = "\n".join(result_texts) if result_texts else "Không có kết quả"
    
    print(f"[Validator] Validating {len(result_texts)} results for: {question}")
    
    try:
        # Chuẩn bị input cho agent
        user_message = f"""THÔNG TIN CẦN ĐÁNH GIÁ:

Câu hỏi gốc: {question}

Phân tích từ Analyst:
- Nội dung: {main_content}
- Mục tiêu: {goal}
- Thông tin quan trọng: {json.dumps(important_info, ensure_ascii=False)}

Lịch sử hội thoại: {json.dumps(conversation_history, ensure_ascii=False) if conversation_history else "Không có lịch sử"}

Kết quả tìm kiếm ({len(result_texts)} kết quả):
{combined_results[:2000]}...

Hãy đánh giá xem thông tin đã đủ để trả lời câu hỏi chưa."""
        
        # Gọi agent
        result = await validator_agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        last_message = result["messages"][-1].content
        print(f"[Validator] Agent response: {last_message}")
        
        # Parse JSON từ response
        parsed_result = parse_json_response(last_message)
        
        enough = parsed_result.get("enough", False)
        confidence = parsed_result.get("confidence", 0.5)
        missing_info = parsed_result.get("missing_info", [])
        quality_assessment = parsed_result.get("quality_assessment", "medium")
        reasoning = parsed_result.get("reasoning", "")
        
        # Cập nhật state
        updated_state = {
            **state,
            "missing": not enough,
            "missing_info": missing_info if not enough else [],
            "validation_confidence": confidence,
            "quality_assessment": quality_assessment,
            "validation_reasoning": reasoning
        }
        
        print(f"[Validator] Result: enough={enough}, confidence={confidence:.2f}, "
              f"quality={quality_assessment}")
        
        if not enough:
            print(f"[Validator] Missing info: {missing_info}")
        
        # # Publish event: Validation completed
        # publish_processing_event(
        #     "validation.status",
        #     conversation_id,
        #     data={
        #         "status": "completed",
        #         "stage": "validator",
        #         "result": {
        #             "enough": enough,
        #             "confidence": confidence,
        #             "quality": quality_assessment,
        #             "missing_count": len(missing_info)
        #         }
        #     }
        # )
        
        return AgentState(**updated_state)
        
    except Exception as e:
        print(f"[Validator] Error: {str(e)}")
        
        # # Publish error event
        # publish_processing_event(
        #     "validation.status",
        #     conversation_id,
        #     data={
        #         "status": "error",
        #         "stage": "validator",
        #         "error": str(e)
        #     }
        # )
        
        # Fallback: Nếu có kết quả thì coi như đủ, không có thì thiếu
        has_results = len(search_results) > 0
        
        return AgentState(
            **state,
            missing=not has_results,
            missing_info=["Cần tìm kiếm thêm thông tin"] if not has_results else [],
            validation_confidence=0.5,
            quality_assessment="unknown",
            validation_reasoning=f"Error during validation: {str(e)}"
        )
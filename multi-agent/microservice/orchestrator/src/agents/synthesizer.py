# agents/synthesizer.py
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from src.state_type import AgentState
from src.publisher import publish_processing_event

from langchain_openai import ChatOpenAI
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
# UTILITY FUNCTION
# ============================================================================
def parse_json_response(content: str) -> Dict[str, Any]:
    """
    Parse JSON từ response của LLM, xử lý cả trường hợp có text xung quanh.
    
    Args:
        content: Nội dung response từ LLM
        
    Returns:
        Dict chứa kết quả đã parse
        
    Raises:
        ValueError: Nếu không tìm thấy JSON hợp lệ
    """
    try:
        # Thử parse trực tiếp
        return json.loads(content)
    except json.JSONDecodeError:
        # Tìm JSON object trong text
        start = content.find('{')
        end = content.rfind('}') + 1
        
        if start != -1 and end > start:
            json_str = content[start:end]
            return json.loads(json_str)
        
        raise ValueError(f"Không tìm thấy JSON hợp lệ trong response: {content}")


# ============================================================================
# SYSTEM PROMPTS
# ============================================================================
SYNTHESIZER_SYSTEM_PROMPT = """Bạn là một hệ thống tổng hợp thông tin chứng khoán.

NHIỆM VỤ:
1. Đọc các kết quả tìm kiếm đã được xác thực
2. Tổng hợp thông tin, trích xuất các điểm chính
3. Loại bỏ thông tin trùng lặp hoặc không liên quan
4. Tham khảo phân tích ý định và mục đích người dùng để đưa ra câu trả lời chuẩn nhất
5. Tham khảo lịch sử hội thoại để cân nhắc câu trả lời
6. Đưa ra một số câu hỏi liên quan

YÊU CẦU:
- Giữ lại các con số, dữ liệu quan trọng
- Sắp xếp thông tin theo mức độ quan trọng
- Loại bỏ thông tin mâu thuẫn hoặc không đáng tin cậy
- Nếu thiếu thông tin để trả lời, hãy trả lời trung thực là chưa có đủ thông tin.
--> Tổng hợp lại thành một câu trả lời hoàn chỉnh

OUTPUT:
Trả về JSON với format:
{
    "response": "Câu trả lời tổng hợp hoàn chỉnh",
    "extra_questions": ["câu hỏi liên quan 1", "câu hỏi liên quan 2"]
}

VÍ DỤ:
Input:
- Câu hỏi: "Giá VNM hôm nay như thế nào?"
- Kết quả: ["VNM đóng cửa ở 85.5k", "VNM tăng 2.1%", "Khối lượng giao dịch VNM 1.2M cổ phiếu"]

Output:
{
    "response": "Hôm nay, giá cổ phiếu VNM đóng cửa ở mức 85.5k, tăng 2.1% với khối lượng giao dịch đạt 1.2 triệu cổ phiếu.",
    "extra_questions": ["Biến động giá VNM trong tuần qua như thế nào?", "Có tin tức gì ảnh hưởng đến VNM hôm nay không?"]
}
"""

CHITCHAT_SYSTEM_PROMPT = """Bạn là một hệ thống tổng hợp thông tin chứng khoán thông minh và thân thiện.

NHIỆM VỤ:
1. Trả lời các câu hỏi chitchat một cách tự nhiên, thân thiện
2. Luôn hướng người dùng về chủ đề chứng khoán một cách khéo léo
3. Đưa ra gợi ý các câu hỏi liên quan đến thị trường chứng khoán

YÊU CẦU:
- Giữ giọng điệu tự nhiên, gần gũi
- Không quá dài dòng
- Luôn gợi ý 2-3 câu hỏi về chứng khoán

OUTPUT:
Trả về JSON với format:
{
    "response": "Câu trả lời tự nhiên, thân thiện",
    "extra_questions": ["câu hỏi về chứng khoán 1", "câu hỏi về chứng khoán 2"]
}

VÍ DỤ:
Input:
- Câu hỏi: "Hôm nay trời đẹp nhỉ?"

Output:
{
    "response": "Vâng, hôm nay thời tiết thật đẹp! Đây là thời điểm tốt để theo dõi thị trường chứng khoán đấy.",
    "extra_questions": [
        "Bạn muốn xem tình hình thị trường hôm nay?",
        "Có cổ phiếu nào bạn quan tâm không?"
    ]
}
"""


# ============================================================================
# AGENTS (Khởi tạo 1 lần khi module load)
# ============================================================================
synthesizer_agent = create_agent(
    llm,
    system_prompt=SYNTHESIZER_SYSTEM_PROMPT,
    name="SynthesizerAgent",
)

chitchat_agent = create_agent(
    llm,
    system_prompt=CHITCHAT_SYSTEM_PROMPT,
    name="ChitchatAgent",
)


# ============================================================================
# NODE
# ============================================================================
async def synthesizer_node(state: AgentState) -> AgentState:
    """
    Node tổng hợp thông tin từ kết quả tìm kiếm.
    Tự động chọn agent phù hợp dựa trên is_chitchat flag.
    
    Args:
        state: AgentState chứa search_results và context
        
    Returns:
        AgentState đã cập nhật với response
    """
    conversation_id = state.get("conversation_id", "")
    search_results = state.get("search_results", [])
    question = state.get("question", "")
    goal = state.get("goal", "")
    main_content = state.get("main_content", "")
    is_chitchat = state.get("is_chitchat", False)
    missing = state.get("mising", False)
    conversation_history = state.get("conversation_history", [])
    
    # Chọn agent phù hợp
    agent = chitchat_agent if is_chitchat else synthesizer_agent
    agent_type = "chitchat" if is_chitchat else "normal"
    
    # Extract text từ search results
    result_texts = []
    for r in search_results:
        if isinstance(r, dict):
            result_texts.append(r.get('text', ''))
        else:
            result_texts.append(str(r))
    
    validated_info = "\n".join(result_texts) if result_texts else "Không có kết quả"
    
    print(f"[Synthesizer] Using {agent_type} agent")
    print(f"[Synthesizer] Synthesizing {len(result_texts)} results for: {question}")
    
    # # Publish event: Summarizing started
    # publish_processing_event(
    #     "summarizing.status",
    #     conversation_id,
    #     data={
    #         "status": "started",
    #         "stage": "synthesizer",
    #         "agent_type": agent_type
    #     }
    # )
    
    try:
        # Chuẩn bị input cho agent
        user_message = f"""Câu hỏi: {question}

Kết quả đã xác thực ({len(result_texts)} kết quả):
{validated_info[:3000]}

Phân tích ý định người dùng: {main_content}
Mục đích câu hỏi: {goal}

Thiếu thông tin để trả lời: {missing}

Lịch sử hội thoại: {json.dumps(conversation_history, ensure_ascii=False) if conversation_history else "Không có lịch sử"}

Hãy tổng hợp thông tin và trả về kết quả theo format JSON đã yêu cầu."""
        
        # Gọi agent
        result = await agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        # Lấy response cuối cùng từ agent
        last_message = result["messages"][-1].content
        print(f"[Synthesizer] Agent response: {last_message[:200]}...")
        
        # Parse JSON từ response
        parsed_result = parse_json_response(last_message)
        
        response = parsed_result.get("response", "")
        extra_questions = parsed_result.get("extra_questions", [])
        
        # Cập nhật state
        updated_state = {
            **state,
            "response": response,
            "extra_questions": extra_questions
        }
        
        print(f"[Synthesizer] Result: response_length={len(response)}, extra_questions={len(extra_questions)}")
        
        # # Publish event: Summarizing completed
        # publish_processing_event(
        #     "summarizing.status",
        #     conversation_id,
        #     data={
        #         "status": "completed",
        #         "stage": "synthesizer",
        #         "agent_type": agent_type,
        #         "result": {
        #             "response_length": len(response),
        #             "extra_questions_count": len(extra_questions)
        #         }
        #     }
        # )
        
        return AgentState(**updated_state)
        
    except Exception as e:
        print(f"[Synthesizer] Error: {str(e)}")
        
        # # Publish error event
        # publish_processing_event(
        #     "summarizing.status",
        #     conversation_id,
        #     data={
        #         "status": "error",
        #         "stage": "synthesizer",
        #         "agent_type": agent_type,
        #         "error": str(e)
        #     }
        # )
        
        # Fallback: Trả về kết quả raw nếu có lỗi
        if is_chitchat:
            fallback_response = "Xin lỗi, tôi gặp chút vấn đề. Bạn có muốn hỏi về thị trường chứng khoán không?"
        else:
            fallback_response = validated_info[:500] if validated_info else "Không thể tổng hợp thông tin"
        
        return AgentState(
            **state,
            response=fallback_response,
            extra_questions=[]
        )
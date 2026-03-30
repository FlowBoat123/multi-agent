# agents/summarizer.py
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from src.state_type import AgentState

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
# SYSTEM PROMPT
# ============================================================================
SUMMARIZER_SYSTEM_PROMPT = """Bạn là một hệ thống tóm tắt hội thoại về chứng khoán.

NHIỆM VỤ:
1. Đọc câu hỏi và câu trả lời mới nhất của người dùng và hệ thống
2. Kết hợp với ngữ cảnh hội thoại trước đó (nếu có và liên quan)
3. Tóm tắt thành một đoạn ngắn gọn, giữ đầy đủ thông tin quan trọng
4. Tạo ra ngữ cảnh hữu ích cho các lượt hội thoại tiếp theo

YÊU CẦU:
- Tóm tắt ngắn gọn (1-3 câu)
- Giữ lại các thông tin quan trọng: mã cổ phiếu, số liệu, thời gian
- Bỏ qua các chi tiết không quan trọng hoặc lặp lại
- Tránh diễn giải dài dòng hoặc thêm ý mới

OUTPUT:
Trả về JSON với format:
{
    "context_summary": "Tóm tắt ngữ cảnh để sử dụng cho lượt hội thoại sau"
}

VÍ DỤ 1 - Hội thoại đầu tiên:
Input:
- Câu hỏi: "Giá VNM hôm nay như thế nào?"
- Câu trả lời: "VNM đóng cửa tại 85.5k, tăng 2.1%"
- Ngữ cảnh trước: ""

Output:
{
    "context_summary": "Người dùng hỏi về giá VNM hôm nay. VNM đóng cửa 85.5k, tăng 2.1%."
}

VÍ DỤ 2 - Hội thoại tiếp theo (liên quan):
Input:
- Câu hỏi: "Còn VCB thì sao?"
- Câu trả lời: "VCB đóng cửa tại 92.3k, giảm 0.5%"
- Ngữ cảnh trước: "Người dùng hỏi về giá VNM hôm nay. VNM đóng cửa 85.5k, tăng 2.1%."

Output:
{
    "context_summary": "Người dùng quan tâm giá cổ phiếu hôm nay: VNM 85.5k (+2.1%), VCB 92.3k (-0.5%)."
}
"""


# ============================================================================
# AGENT
# ============================================================================
summarizer_agent = create_agent(
    llm,
    system_prompt=SUMMARIZER_SYSTEM_PROMPT,
    name="SummarizerAgent",
)


# ============================================================================
# NODE
# ============================================================================
async def summarizer_node(state: AgentState) -> AgentState:
    """
    Node tóm tắt hội thoại để tạo ngữ cảnh cho lượt tiếp theo.
    
    Args:
        state: AgentState chứa question, response và context
        
    Returns:
        AgentState đã cập nhật với context mới
    """
    question = state.get("question", "")
    answer = state.get("response", "")
    conversation_history = state.get("conversation_history", [])
    
    print(f"[Summarizer] Summarizing conversation")
    
    try:
        # Chuẩn bị input cho agent
        user_message = f"""Câu hỏi mới: {question}

Câu trả lời: {answer}

Lịch sử hội thoại: {json.dumps(conversation_history, ensure_ascii=False) if conversation_history else "Không có lịch sử"}

Hãy tóm tắt và tạo ngữ cảnh cho lượt hội thoại tiếp theo."""
        
        # Gọi agent
        result = await summarizer_agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        # Lấy response cuối cùng từ agent
        last_message = result["messages"][-1].content
        print(f"[Summarizer] Agent response: {last_message}")
        
        # Parse JSON từ response
        parsed_result = parse_json_response(last_message)
        
        context_summary = parsed_result.get("context_summary", "")
        
        # Cập nhật state
        updated_state = {
            **state,
            "context": context_summary
        }
        
        print(f"[Summarizer] New context length: {len(context_summary)}")
        
        return AgentState(**updated_state)
        
    except Exception as e:
        print(f"[Summarizer] Error: {str(e)}")
        
        # Fallback: Tạo context đơn giản
        fallback_context = f"Q: {question[:100]}... A: {answer[:100]}..."
        
        return AgentState(
            **state,
            context=fallback_context
        )
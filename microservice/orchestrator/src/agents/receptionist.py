# agents/receptionist.py
import os
import json
from typing import List, Dict, Any
from src.state_type import AgentState
from src.publisher import publish_processing_event

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.agents import create_agent

# Khởi tạo LLM
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
    temperature=0
)

# System prompt
SYSTEM_PROMPT = """Bạn là một hệ thống phân loại câu hỏi về chứng khoán.

NHIỆM VỤ:
1. Đọc câu hỏi của người dùng và lịch sử hội thoại (nếu có)
2. Xác định xem câu hỏi có phải là chitchat (trò chuyện thông thường/không liên quan chứng khoán) không
3. Đánh giá mức độ rõ ràng của câu hỏi (0-10):
   - 0-3: Câu hỏi mơ hồ, thiếu thông tin
   - 4-6: Câu hỏi tạm được nhưng cần thêm ngữ cảnh
   - 7-10: Câu hỏi rõ ràng, đầy đủ thông tin

OUTPUT:
Trả về JSON với format:
{
    "is_chitchat": true/false,
    "clearance_level": 0-10,
    "need_summary": true/false,
    "reasoning": "Lý do phân loại ngắn gọn"
}

VÍ DỤ:
- "Giá cổ phiếu VNM hôm nay như thế nào?" → is_chitchat: false, clearance_level: 9
- "Hôm nay trời đẹp nhỉ?" → is_chitchat: true, clearance_level: 10
- "Cổ phiếu đó thế nào?" → is_chitchat: false, clearance_level: 2 (thiếu mã cổ phiếu)
"""

# Tạo agent
receptionist_agent = create_agent(
    llm,
    system_prompt=SYSTEM_PROMPT,
    name="ReceptionistAgent",
)


async def receptionist_node(state: AgentState) -> AgentState:
    """
    Node phân loại câu hỏi và đánh giá mức độ rõ ràng.
    
    Args:
        state: AgentState chứa question và conversation_history
        
    Returns:
        AgentState đã cập nhật với kết quả phân loại
    """
    conversation_id = state.get("conversation_id", "")
    question = state["question"]
    conversation_history = state.get("conversation_history", [])
    
    # # Publish event: Analysis started
    # publish_processing_event(
    #     "analysis.status",
    #     conversation_id,
    #     data={"status": "started"}
    # )
    
    # Chuẩn bị input cho agent
    user_message = f"""Câu hỏi: {question}

Lịch sử hội thoại: {json.dumps(conversation_history, ensure_ascii=False) if conversation_history else "Không có lịch sử"}

Hãy phân tích và trả về kết quả theo format JSON đã yêu cầu."""
    
    print(f"[Receptionist] Analyzing question: {question}")
    
    try:
        # Gọi agent
        result = await receptionist_agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        # Lấy response cuối cùng từ agent
        last_message = result["messages"][-1].content
        print(f"[Receptionist] Agent response: {last_message}")
        
        # Parse JSON từ response
        parsed_result = parse_json_response(last_message)
        
        need_summary = len(conversation_history) > 2
        
        # Cập nhật state
        updated_state = {
            **state,
            "is_chitchat": parsed_result.get("is_chitchat", False),
            "clearance_level": parsed_result.get("clearance_level", 5),
            "need_summary": need_summary,
        }
        
        print(f"[Receptionist] Result: is_chitchat={updated_state['is_chitchat']}, "
              f"clearance_level={updated_state['clearance_level']}, "
              f"need_summary={updated_state['need_summary']}")
        
        # # Publish event: Analysis completed
        # publish_processing_event(
        #     "analysis.status",
        #     conversation_id,
        #     data={
        #         "status": "completed",
        #         "result": {
        #             "is_chitchat": updated_state["is_chitchat"],
        #             "clearance_level": updated_state["clearance_level"],
        #             "need_summary": updated_state["need_summary"]
        #         }
        #     }
        # )
        
        return AgentState(**updated_state)
        
    except Exception as e:
        print(f"[Receptionist] Error: {str(e)}")
        
        # # Publish error event
        # publish_processing_event(
        #     "analysis.status",
        #     conversation_id,
        #     data={
        #         "status": "error",
        #         "error": str(e)
        #     }
        # )
        
        # Return default values on error
        return AgentState(
            **state,
            is_chitchat=False,
            clearance_level=5,
            need_summary=False,
        )


def parse_json_response(content: str) -> Dict[str, Any]:
    """
    Parse JSON từ response của LLM, xử lý cả trường hợp có text xung quanh.
    
    Args:
        content: Nội dung response từ LLM
        
    Returns:
        Dict chứa kết quả đã parse
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
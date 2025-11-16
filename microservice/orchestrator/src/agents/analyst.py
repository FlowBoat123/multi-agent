# agents/analyst.py
import os
import json
from typing import List, Dict, Any
from src.state_type import AgentState
from src.publisher import publish_processing_event

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent


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
ANALYST_SYSTEM_PROMPT = """Bạn là một hệ thống phân tích nội dung câu hỏi về chứng khoán.

NHIỆM VỤ:
1. Phân tích câu hỏi của người dùng kết hợp với ngữ cảnh, lịch sử cuộc hội thoại
2. Xác định:
   - Nội dung chính của câu hỏi
   - Mục tiêu/ý định của người hỏi
   - Các thông tin quan trọng cần chú ý (mã cổ phiếu, ngày tháng, chỉ số...)
3. Nếu câu hỏi quá rộng, tạo các truy vấn phụ để làm rõ

OUTPUT:
Trả về JSON với format:
{
    "main_content": "Tóm tắt nội dung chính",
    "goal": "Mục tiêu của người hỏi",
    "important_info": ["thông tin 1", "thông tin 2", ...],
    "sub_query": ["truy vấn phụ 1", "truy vấn phụ 2", ...]
}

VÍ DỤ:
Input: "VNM hôm nay tăng giá không?"
Output:
{
    "main_content": "Hỏi về biến động giá cổ phiếu VNM trong ngày",
    "goal": "Kiểm tra giá cổ phiếu tăng/giảm",
    "important_info": ["Mã cổ phiếu: VNM", "Thời gian: hôm nay"],
    "sub_query": []
}

Input: "Cho tôi biết về thị trường"
Output:
{
    "main_content": "Hỏi về thị trường chứng khoán nói chung",
    "goal": "Tìm hiểu tổng quan thị trường",
    "important_info": [],
    "sub_query": [
        "Thị trường nào? VN-Index, HNX, UPCOM?",
        "Muốn biết về khía cạnh gì? Giá, thanh khoản, tin tức?"
    ]
}
"""


# ============================================================================
# AGENT
# ============================================================================
analyst_agent = create_agent(
    llm,
    system_prompt=ANALYST_SYSTEM_PROMPT,
    name="AnalystAgent",
)


# ============================================================================
# NODE
# ============================================================================
async def analyst_node(state: AgentState) -> AgentState:
    """
    Node phân tích nội dung và ý định câu hỏi.
    
    Args:
        state: AgentState chứa question và context
        
    Returns:
        AgentState đã cập nhật với kết quả phân tích
    """
    conversation_id = state.get("conversation_id", "")
    question = state["question"]
    conversation_history = state.get("conversation_history", [])
    
    # # Publish event: Analysis started
    # publish_processing_event(
    #     "analysis.status",
    #     conversation_id,
    #     data={"status": "started", "stage": "analyst"}
    # )
    
    # Chuẩn bị input cho agent
    user_message = f"""Câu hỏi: {question}

Lịch sử hội thoại: {json.dumps(conversation_history, ensure_ascii=False) if conversation_history else "Không có lịch sử"}

Hãy phân tích và trả về kết quả theo format JSON đã yêu cầu."""
    
    print(f"[Analyst] Analyzing question: {question}")
    
    try:
        # Gọi agent
        result = await analyst_agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        # Lấy response cuối cùng từ agent
        last_message = result["messages"][-1].content
        print(f"[Analyst] Agent response: {last_message}")
        
        # Parse JSON từ response
        parsed_result = parse_json_response(last_message)
        
        # Cập nhật state
        updated_state = {
            **state,
            "main_content": parsed_result.get("main_content", ""),
            "goal": parsed_result.get("goal", ""),
            "important_info": parsed_result.get("important_info", []),
            "sub_query": parsed_result.get("sub_query", [])
        }
        
        print(f"sub_queries={len(updated_state['sub_query'])}")
        
        # # Publish event: Analysis completed
        # publish_processing_event(
        #     "analysis.status",
        #     conversation_id,
        #     data={
        #         "status": "completed",
        #         "stage": "analyst",
        #         "result": {
        #             "type": updated_state["state_type"],
        #             "main_content": updated_state["main_content"],
        #             "goal": updated_state["goal"],
        #             "sub_query_count": len(updated_state["sub_query"])
        #         }
        #     }
        # )
        
        return AgentState(**updated_state)
        
    except Exception as e:
        print(f"[Analyst] Error: {str(e)}")
        
        # # Publish error event
        # publish_processing_event(
        #     "analysis.status",
        #     conversation_id,
        #     data={
        #         "status": "error",
        #         "stage": "analyst",
        #         "error": str(e)
        #     }
        # )
        
        # Return default values on error
        return AgentState(
            **state,
            main_content="",
            goal="",
            important_info=[],
            sub_query=[]
        )
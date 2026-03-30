# agents/searcher.py
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from underthesea import word_tokenize

from src.state_type import AgentState
from src.utils.vector_db import VectorDBClient
from src.utils.model import get_embedding
from src.utils.deepseek_model import DeepSeekChatOpenAI

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage
from langchain.agents import create_agent

load_dotenv()


# ============================================================================
# LLM INSTANCE
# ============================================================================
llm = DeepSeekChatOpenAI(
    model="deepseek-chat",
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
    temperature=0
)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
def segment(segment_text: str, format_: str = "text") -> str:
    """Phân tách từ tiếng Việt."""
    return word_tokenize(segment_text, format=format_)


def rerank_results(results: List[Dict], important_info: List[str], top_k: int = 5) -> List[Dict]:
    """Re-rank kết quả tìm kiếm dựa trên important_info."""
    if not important_info or not results:
        return results[:top_k]
    
    def get_text(item: Dict) -> str:
        if isinstance(item, dict):
            return item.get('text', item.get('doc', ''))
        return str(item)
    
    scored_results = []
    for result in results:
        text = get_text(result).lower()
        score = sum(1 for keyword in important_info if keyword.lower() in text)
        scored_results.append((score, result))
    
    ranked = sorted(scored_results, key=lambda x: x[0], reverse=True)
    return [item[1] for item in ranked[:top_k]]


# ============================================================================
# TOOLS - ✅ ĐÚNG: Dùng @tool decorator
# ============================================================================
@tool
async def search_vector_db(query: str, top_k: int = 3, expand_context: bool = True) -> List[Dict[str, Any]]:
    """
    Tìm kiếm trong vector database về tài liệu, báo cáo, luật chứng khoán.
    
    Sử dụng khi cần:
    - Tìm thông tin từ báo cáo phân tích
    - Tìm dữ liệu lịch sử từ tài liệu
    - Tìm thông tin về luật
    
    Args:
        query: Câu truy vấn tìm kiếm (tiếng Việt)
        top_k: Số lượng kết quả tối đa (mặc định 3)
        expand_context: Nếu True, lấy thêm 4 chunks xung quanh chunk tìm được (mặc định True)
        
    Returns:
        Danh sách kết quả, mỗi kết quả có 'text' và 'metadata'
    """
    vector_db = VectorDBClient()
    collection_name = os.getenv("REGEX_SEMANTIC_COLLECTION", "Regex_semantic")
    
    try:
        query_segmented = segment(query)
        embedding = get_embedding(query_segmented)

        # Bước 1: Tìm kiếm hybrid với top_k=1 để lấy chunk chính xác nhất
        results = await vector_db.search_hybrid(
            query=query_segmented,
            embedding=embedding,
            collection_name=collection_name,
            top_k=1  # Chỉ lấy 1 kết quả tốt nhất
        )
        
        print(f"[VectorDB] Initial search result: {len(results)} results")
        
        if not results:
            return []

        context = []
        
        # Bước 2: Với mỗi kết quả tìm được, expand context
        for doc in results:
            # Thêm chunk chính (kết quả tìm kiếm ban đầu)
            main_chunk = {
                'text': doc.get('text', ''),
                'metadata': {
                    'document_id': doc.get('document_id', ''),
                    'page_number': doc.get('metadata', {}).get('page_number', 0),
                    'file_name': doc.get('metadata', {}).get('file_name', ''),
                    'chunk_index': doc.get('metadata', {}).get('chunk_index', 0),
                    'score': doc.get('score', 0),
                    'source': 'vector_db',
                    'is_main_result': True  # Đánh dấu đây là kết quả chính
                }
            }
            context.append(main_chunk)
            
            # Bước 3: Nếu expand_context=True, lấy thêm 4 chunks xung quanh
            if expand_context:
                document_id = doc.get('document_id', '')
                chunk_index = doc.get('metadata', {}).get('chunk_index', 0)
                user_id = doc.get('user_id')
                
                if document_id and chunk_index is not None:
                    try:
                        # Lấy 4 chunks bắt đầu từ chunk hiện tại
                        # (hoặc có thể lấy 2 chunks trước + 2 chunks sau nếu muốn)
                        expanded_chunks = await vector_db.search_by_chunk_range(
                            collection_name=collection_name,
                            document_id=document_id,
                            start_chunk_index=chunk_index,  # Bắt đầu từ chunk hiện tại
                            num_chunks=4,
                            user_id=user_id
                        )
                        
                        print(f"[VectorDB] Expanded context: {len(expanded_chunks)} chunks")
                        
                        # Thêm các chunks mở rộng vào context
                        for exp_chunk in expanded_chunks:
                            # Skip nếu là chunk chính đã thêm
                            if exp_chunk.get('chunk_index') == chunk_index:
                                continue
                                
                            context.append({
                                'text': exp_chunk.get('text', ''),
                                'metadata': {
                                    'document_id': exp_chunk.get('document_id', ''),
                                    'page_number': exp_chunk.get('metadata', {}).get('page_number', 0),
                                    'file_name': exp_chunk.get('metadata', {}).get('file_name', ''),
                                    'chunk_index': exp_chunk.get('metadata', {}).get('chunk_index', 0),
                                    'source': 'vector_db',
                                    'is_main_result': False,
                                }
                            })
                            
                    except Exception as expand_error:
                        print(f"[VectorDB] Error expanding context: {str(expand_error)}")
                        # Tiếp tục với chunk chính nếu expand thất bại
        
        print(f"[VectorDB] Total context chunks: {len(context)}")
        return context
        
    except Exception as e:
        print(f"[VectorDB] Error: {str(e)}")
        return []
    finally:
        vector_db.close()

@tool
async def search_web(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Tìm kiếm tin tức và thông tin mới nhất trên web.
    
    Sử dụng khi cần:
    - Tin tức trong 7 ngày gần nhất
    - Sự kiện mới về công ty/thị trường
    - Thông tin cập nhật chưa có trong database
    
    Args:
        query: Câu truy vấn (ngắn gọn, tập trung từ khóa)
        top_k: Số lượng kết quả tối đa
        
    Returns:
        Danh sách kết quả từ web
    """
    # TODO: Implement web search (Tavily, SerpAPI, etc.)
    print(f"[WebSearch] Searching for: {query}")
    return []


@tool
async def get_vnstock_data(symbol: str, data_types: List[str]) -> Dict[str, Any]:
    """
    Lấy dữ liệu chứng khoán realtime từ VNStock.
    
    Sử dụng khi cần:
    - Giá cổ phiếu hiện tại
    - Thông tin công ty
    - Báo cáo tài chính
    - Lịch sử giao dịch
    - Chỉ số kỹ thuật
    
    Args:
        symbol: Mã chứng khoán (VD: VNM, VCB, HPG)
        data_types: Danh sách loại dữ liệu cần lấy
            - "price": Giá hiện tại và biến động
            - "company_info": Thông tin cơ bản công ty
            - "financial": Báo cáo tài chính
            - "trading": Lịch sử giao dịch
            - "technical": Chỉ số kỹ thuật
            
    Returns:
        Dictionary chứa dữ liệu đã request
    """
    # TODO: Implement vnstock API call
    print(f"[VNStock] Getting {data_types} for {symbol}")
    
    result = {
        "symbol": symbol,
        "data": {},
        "metadata": {"source": "vnstock"}
    }
    
    # Mock data - replace với vnstock API thực
    for data_type in data_types:
        if data_type == "price":
            result["data"]["price"] = {
                "current": 100000,
                "change": 2.5,
                "volume": 1000000
            }
        elif data_type == "company_info":
            result["data"]["company_info"] = {
                "name": f"Công ty {symbol}",
                "industry": "Ngành công nghiệp"
            }
    
    return result


# ============================================================================
# SYSTEM PROMPT - ✅ CẢI THIỆN: Rõ ràng hơn
# ============================================================================
SEARCHER_SYSTEM_PROMPT = """Bạn là chuyên gia tìm kiếm thông tin chứng khoán.

INPUT:
- Câu hỏi gốc từ user
- Phân tích từ Analyst: main_content, goal, important_info, sub_queries
- Đánh giá từ Validator (nếu có): missiong_info, validation_reasoning

NHIỆM VỤ:
Dựa trên phân tích của Analyst và đánh giá Validator (nếu có), SỬ DỤNG TOOLS để tìm kiếm thông tin cần thiết.

TOOLS CÓ SẴN:
1. search_vector_db: Tìm trong database như những thông tin tĩnh, ít thay đổi như luật, chính sách,...
2. get_vnstock_data: Lấy data realtime (giá, tài chính, công ty)
3. search_web: Tìm tin tức mới nhất

CHIẾN LƯỢC:
- Phân tích câu hỏi → Xác định cần loại thông tin gì
- GỌI NHIỀU TOOLS nếu cần (ví dụ: cả vector_db + vnstock)
- Với mỗi tool, tạo query/params tối ưu, chỉ cần đủ thông tin

VÍ DỤ:
Câu hỏi: "Phân tích cổ phiếu VNM"
→ Gọi search_vector_db("phân tích VNM triển vọng", top_k=3)
→ Gọi get_vnstock_data("VNM", ["price", "company_info", "financial"])

Câu hỏi: "Tin tức mới nhất về VCB"
→ Gọi search_web("VCB tin tức", top_k=3)
→ Gọi get_vnstock_data("VCB", ["price"])

LƯU Ý:
- important_info từ Analyst chứa từ khóa quan trọng → dùng trong query
- sub_queries từ Analyst → dựa vào đó tạo ra query tối ưu
- KHÔNG TRẢ VỀ JSON, hãy GỌI TOOLS TRỰC TIẾP!
"""


# ============================================================================
# AGENT - ✅ ĐÚNG: Tạo agent với tools
# ============================================================================
searcher_agent = create_agent(
    llm,
    tools=[search_vector_db, get_vnstock_data, search_web],
    system_prompt=SEARCHER_SYSTEM_PROMPT,
    name="SearcherAgent",
)


# ============================================================================
# NODE - ✅ ĐÚNG: Extract tool results từ messages
# ============================================================================
async def searcher_node(state: AgentState) -> AgentState:
    """
    Node tìm kiếm thông tin.
    Agent sẽ TỰ ĐỘNG gọi tools, ta chỉ cần extract kết quả.
    """
    main_content = state.get("main_content", "")
    goal = state.get("goal", "")
    important_info = state.get("important_info", [])
    sub_queries = state.get("sub_query", [])
    question = state.get("question", "")
    missing_info = state.get("missing_info", [])
    validation_reasoning = state.get("validation_reasoning", "")
    
    print(f"[Searcher] Starting search for: {main_content}")
    print(f"[Searcher] Important info: {important_info}")
    
    try:
        # Chuẩn bị input cho agent
        user_message = f"""Thông tin phân tích từ Analyst:

Câu hỏi gốc: {question}
Nội dung chính: {main_content}
Mục tiêu: {goal}
Từ khóa quan trọng: {', '.join(important_info)}
Truy vấn phụ: {', '.join(sub_queries) if sub_queries else 'Không có'}
Thông tin còn thiếu: {", ".join(missing_info)}
Lý luận xác thực: {validation_reasoning}

Hãy sử dụng tools để tìm kiếm thông tin cần thiết."""
        
        # ✅ ĐÚNG: Gọi agent - agent sẽ TỰ ĐỘNG gọi tools
        result = await searcher_agent.ainvoke({
            "messages": [HumanMessage(content=user_message)]
        })
        
        print(f"[Searcher] Agent completed with {len(result['messages'])} messages")
        
        # ✅ ĐÚNG: Extract tool results từ messages
        all_results = _extract_tool_results(result["messages"])
        
        # Nếu state đã có search_results từ trước, merge vào all_results
        existing_search_results = state.get("search_results") or []
        if existing_search_results:
            print(f"[Searcher] Merging {len(existing_search_results)} existing search_results from state")
            # Ensure we preserve tool results first, then append previous state results
            all_results.extend(existing_search_results)
        
        # Re-rank kết quả
        reranked_results = rerank_results(all_results, important_info, top_k=5)
        print(f"[Searcher] After rerank: {len(reranked_results)} results")
        
        # Cập nhật state
        return AgentState(
            **state,
            search_results=reranked_results,
            metadata=[r.get("metadata", {}) for r in reranked_results]
        )
        
    except Exception as e:
        print(f"[Searcher] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return AgentState(
            **state,
            search_results=[],
            metadata=[]
        )


def _extract_tool_results(messages: List) -> List[Dict]:
    """
    ✅ ĐÚNG: Extract kết quả từ ToolMessage trong messages.
    
    LangChain agent flow:
    1. HumanMessage: User input
    2. AIMessage: Agent quyết định gọi tool (có tool_calls)
    3. ToolMessage: Kết quả từ tool
    4. AIMessage: Agent tổng hợp (nếu có)
    5. Lặp lại nếu cần gọi thêm tools
    """
    results = []
    
    for msg in messages:
        # ToolMessage chứa kết quả từ tool execution
        if isinstance(msg, ToolMessage):
            content = msg.content
            
            # Parse content (có thể là string JSON hoặc list)
            try:
                if isinstance(content, str):
                    parsed = json.loads(content)
                else:
                    parsed = content
                
                # Nếu là list of dicts → extend
                if isinstance(parsed, list):
                    results.extend(parsed)
                # Nếu là single dict → append
                elif isinstance(parsed, dict):
                    # Nếu là vnstock data, wrap lại
                    if "symbol" in parsed:
                        results.append({
                            "text": json.dumps(parsed, ensure_ascii=False),
                            "metadata": parsed.get("metadata", {"source": "vnstock"})
                        })
                    else:
                        results.append(parsed)
                        
            except json.JSONDecodeError:
                # Nếu không parse được, coi như text thuần
                results.append({
                    "text": str(content),
                    "metadata": {"source": "unknown"}
                })
    
    return results
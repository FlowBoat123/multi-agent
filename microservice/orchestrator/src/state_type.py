from typing import TypedDict, Optional, List, Any, Dict
from enum import Enum

class AgentState(TypedDict):
    question: str
    conversation_id: str
    conversation_history: Optional[List[Dict[str, str]]]
    validator_retries: int  # số lần đã thử với validator
    
    # Receptionist fields
    is_chitchat: Optional[bool]
    clearance_level: Optional[int]
    need_summary: Optional[bool]
    reasoning: Optional[str]
    
    # Analyst fields
    main_content: Optional[str]
    goal: Optional[str]
    important_info: Optional[List[str]]
    sub_query: Optional[List[str]]
    
    # Searcher fields
    search_results: Optional[List[Any]]
    metadata: Optional[Any]
    
    # Validator fields
    missing: Optional[bool]
    missing_info: Optional[List[str]]
    validation_confidence: Optional[float]
    quality_assessment: Optional[str]
    validation_reasoning: Optional[str]
    
    # Synthesizer fields
    response: Optional[Any]
    extra_questions: Optional[List[str]]
    
    # Summarizer fields
    context: Optional[str]

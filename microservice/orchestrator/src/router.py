# orchestrator/router.py
import logging
from langgraph.graph import END
from src.state_type import AgentState

logging.basicConfig(level=logging.INFO)

def receptionist_edge(state: AgentState):
    is_chitchat = state["is_chitchat"]
    if is_chitchat:
        return "synthesizer"
    return "analyst"

def analyst_edge(state: AgentState):
    return "searcher"

def searcher_edge(state: AgentState):
    logging.info("Searcher done, moving to validator")
    return "validator"

def validator_edge(state: AgentState):
    missing = state.get("mising")
    if missing:
        if state['validator_retries'] < 3:
            return "searcher"
    return "synthesizer"

def synthesizer_edge(state: AgentState):
    need_summary = state.get("need_summary", False)
    if need_summary:
        return "summarizer"
    return END

def summarizer_edge(state: AgentState):
    logging.info("Summarizer done, ending flow")
    return END

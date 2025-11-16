import logging
from langgraph.graph import StateGraph, END, START
from langgraph.store.memory import InMemoryStore
from src.state_type import AgentState
from src.agents.receptionist import receptionist_node
from src.agents.searcher import searcher_node
from src.agents.analyst import analyst_node
from src.agents.validator import validator_node
from src.agents.synthesizer import synthesizer_node
from src.agents.summarizer import summarizer_node
from src.router import (
    receptionist_edge,
    analyst_edge,
    searcher_edge,
    validator_edge,
    synthesizer_edge,
    summarizer_edge
)

logging.basicConfig(level=logging.INFO)

def build_graph():
    graph = StateGraph(AgentState)
    store = InMemoryStore()

    graph.add_node("receptionist", receptionist_node)
    graph.add_node("searcher", searcher_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("validator", validator_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("summarizer", summarizer_node)

    graph.add_edge(START, "receptionist")
    graph.add_conditional_edges(
        "receptionist",
        receptionist_edge,
        {"analyst": "analyst", "synthesizer": "synthesizer"}
    )
    graph.add_edge("analyst", "searcher")
    graph.add_edge("searcher", "validator")
    graph.add_conditional_edges(
        "validator",
        validator_edge,
        {"searcher": "searcher", "synthesizer": "synthesizer"}
    )
    graph.add_conditional_edges(
        "synthesizer",
        synthesizer_edge,
        {"summarizer": "summarizer", END: END}
    )
    graph.add_edge("summarizer", END)

    return graph.compile(store=store)

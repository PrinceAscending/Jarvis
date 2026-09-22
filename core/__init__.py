"""Core intelligence package for JARVIS."""

__all__ = [
    "orchestrator",
    "Orchestrator",
    "WorkflowEngine",
]


def __getattr__(name: str):
    if name in ("orchestrator", "Orchestrator"):
        from core.orchestrator import orchestrator, Orchestrator
        return orchestrator if name == "orchestrator" else Orchestrator
    if name == "WorkflowEngine":
        from core.workflows import WorkflowEngine
        return WorkflowEngine
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

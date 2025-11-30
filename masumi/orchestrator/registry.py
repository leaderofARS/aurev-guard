from typing import List, Dict, Any
from pydantic import BaseModel


class AgentDescriptor(BaseModel):
    name: str
    capabilities: List[str]
    endpoint: str
    auth: Dict[str, Any]
    version: str
    enabled: bool

    def to_dict(self) -> Dict[str, Any]:
        """
        Compatibility helper: works across Pydantic v1 and v2.
        """
        if hasattr(self, "model_dump"):   # Pydantic v2
            return self.model_dump()
        return self.dict()                # Pydantic v1


class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, AgentDescriptor] = {}

    def register(self, agent: AgentDescriptor):
        self._agents[agent.name] = agent

    def get(self, name: str) -> AgentDescriptor:
        if name not in self._agents:
            raise KeyError(f"Agent '{name}' not found")
        return self._agents[name]

    def list(self) -> List[AgentDescriptor]:
        return list(self._agents.values())
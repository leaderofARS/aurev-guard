# orchestrator/registry.py
from typing import Dict, List, TypedDict

class AgentDescriptor(TypedDict):
    name: str
    capabilities: List[str]
    endpoint: str
    auth: dict
    version: str
    enabled: bool

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, AgentDescriptor] = {}

    def register(self, agent: AgentDescriptor):
        if agent["name"] in self._agents:
            raise ValueError("Duplicate agent")
        if not agent["capabilities"]:
            raise ValueError("Capabilities required")
        self._agents[agent["name"]] = agent

    def enable(self, name: str, enabled: bool):
        self._agents[name]["enabled"] = enabled

    def get(self, name: str) -> AgentDescriptor:
        return self._agents[name]

    def list(self) -> List[AgentDescriptor]:
        return list(self._agents.values())
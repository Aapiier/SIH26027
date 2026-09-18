"""
RailSync AI — Resources & Machinery Generator
Generates track machines, tower wagons, and departmental maintenance crews.
"""

from typing import List, Dict, Any
from dataset_generation.config import RESOURCE_CATALOG

def generate_resources() -> List[Dict[str, Any]]:
    """Return catalog of maintenance machines and crew teams with physical parameters."""
    return [dict(res) for res in RESOURCE_CATALOG]

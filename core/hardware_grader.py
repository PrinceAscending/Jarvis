"""Hardware Fit Grading for Local AI Models in JARVIS.

Audits GPU VRAM (NVIDIA, AMD, Intel) and System RAM using native Windows WMI/CIM,
and provides honest, accurate performance fit grades for Ollama models.
Inspired by SERA-v1 ModelRecommender.
"""

import json
import logging
import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import psutil

logger = logging.getLogger("jarvis.hardware_grader")

# Estimated VRAM/RAM required for Q4_K_M quantized models including context window
MODEL_REQUIREMENTS = {
    "qwen2.5:0.5b": {"min_vram_gb": 0.8, "min_ram_gb": 1.2, "tokens_per_sec": "Fast (>40 t/s)"},
    "llama3.2:1b": {"min_vram_gb": 1.4, "min_ram_gb": 2.0, "tokens_per_sec": "Fast (>35 t/s)"},
    "llama3.2:3b": {"min_vram_gb": 2.6, "min_ram_gb": 3.8, "tokens_per_sec": "Optimal (~25-30 t/s)"},
    "phi3.5:3.8b": {"min_vram_gb": 3.0, "min_ram_gb": 4.5, "tokens_per_sec": "Optimal (~20-25 t/s)"},
    "qwen2.5:3b": {"min_vram_gb": 2.6, "min_ram_gb": 4.0, "tokens_per_sec": "Optimal (~25 t/s)"},
    "mistral:7b": {"min_vram_gb": 4.8, "min_ram_gb": 7.0, "tokens_per_sec": "Moderate (~12-18 t/s)"},
    "qwen2.5:7b": {"min_vram_gb": 5.0, "min_ram_gb": 7.5, "tokens_per_sec": "Moderate (~12-18 t/s)"},
    "llama3:8b": {"min_vram_gb": 5.2, "min_ram_gb": 8.0, "tokens_per_sec": "Moderate (~10-15 t/s)"},
    "gemma2:9b": {"min_vram_gb": 6.5, "min_ram_gb": 9.5, "tokens_per_sec": "Demanding (~8-12 t/s)"},
    "qwen2.5:14b": {"min_vram_gb": 10.0, "min_ram_gb": 15.0, "tokens_per_sec": "Heavy (~5-8 t/s)"},
    "llama3:70b": {"min_vram_gb": 42.0, "min_ram_gb": 50.0, "tokens_per_sec": "Server Class"},
}


@dataclass
class GPUInfo:
    name: str
    vram_gb: float
    is_dedicated: bool
    driver_version: str = ""


class HardwareGrader:
    """Evaluates local machine hardware to score AI model compatibility."""

    def __init__(self):
        self._cached_gpu: Optional[List[GPUInfo]] = None
        self._cached_ram: Optional[Dict[str, float]] = None

    def get_gpu_info(self) -> List[GPUInfo]:
        """Detect all GPUs and VRAM sizes using native Windows CIM."""
        if self._cached_gpu is not None:
            return self._cached_gpu

        gpus: List[GPUInfo] = []
        try:
            cmd = "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion | ConvertTo-Json -Compress"
            proc = subprocess.run(
                ["powershell", "-NoProfile", "-Command", cmd],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                raw = proc.stdout.strip()
                data = json.loads(raw)
                items = data if isinstance(data, list) else [data]

                for item in items:
                    name = item.get("Name") or "Unknown GPU"
                    # AdapterRAM is unsigned 32-bit integer or 64-bit in bytes
                    ram_bytes = item.get("AdapterRAM") or 0
                    ram_gb = round(ram_bytes / (1024**3), 2)

                    # Determine if dedicated GPU
                    name_lower = name.lower()
                    is_dedicated = any(
                        brand in name_lower
                        for brand in ["nvidia", "geforce", "rtx", "gtx", "radeon rx", "arc"]
                    ) and "intel" not in name_lower

                    gpus.append(
                        GPUInfo(
                            name=name,
                            vram_gb=ram_gb,
                            is_dedicated=is_dedicated,
                            driver_version=item.get("DriverVersion", ""),
                        )
                    )
        except Exception as e:
            logger.warning(f"Failed to query GPUs via CIM: {e}")

        # Fallback if no GPU returned
        if not gpus:
            gpus.append(GPUInfo(name="Generic Display Adapter", vram_gb=0.0, is_dedicated=False))

        self._cached_gpu = gpus
        return gpus

    def get_best_vram_gb(self) -> float:
        """Return the highest dedicated VRAM found, or integrated VRAM."""
        gpus = self.get_gpu_info()
        dedicated = [g for g in gpus if g.is_dedicated]
        if dedicated:
            return max(g.vram_gb for g in dedicated)
        return max(g.vram_gb for g in gpus) if gpus else 0.0

    def get_system_ram(self) -> Dict[str, float]:
        """Return total and available system RAM in GB."""
        mem = psutil.virtual_memory()
        return {
            "total_gb": round(mem.total / (1024**3), 2),
            "available_gb": round(mem.available / (1024**3), 2),
            "used_percent": mem.percent,
        }

    def grade_model(self, model_name: str) -> Dict[str, Any]:
        """Grade how well a specific model will perform on current hardware."""
        model_clean = model_name.lower().strip()
        reqs = MODEL_REQUIREMENTS.get(model_clean)

        # Approximate if model not in table
        if not reqs:
            if "70b" in model_clean:
                reqs = {"min_vram_gb": 42.0, "min_ram_gb": 50.0, "tokens_per_sec": "Server Class"}
            elif "14b" in model_clean:
                reqs = {"min_vram_gb": 10.0, "min_ram_gb": 15.0, "tokens_per_sec": "Heavy (~5-8 t/s)"}
            elif "7b" in model_clean or "8b" in model_clean:
                reqs = {"min_vram_gb": 5.0, "min_ram_gb": 7.5, "tokens_per_sec": "Moderate (~12-18 t/s)"}
            elif "3b" in model_clean or "4b" in model_clean:
                reqs = {"min_vram_gb": 2.6, "min_ram_gb": 4.0, "tokens_per_sec": "Optimal (~25 t/s)"}
            elif "1b" in model_clean or "0.5b" in model_clean:
                reqs = {"min_vram_gb": 1.2, "min_ram_gb": 2.0, "tokens_per_sec": "Fast (>35 t/s)"}
            else:
                reqs = {"min_vram_gb": 4.5, "min_ram_gb": 6.5, "tokens_per_sec": "Variable"}

        best_vram = self.get_best_vram_gb()
        ram = self.get_system_ram()
        avail_ram = ram["available_gb"]
        total_ram = ram["total_gb"]

        min_vram = reqs["min_vram_gb"]
        min_ram = reqs["min_ram_gb"]

        # Honest Grading Criteria
        if best_vram >= min_vram + 0.8:
            grade = "excellent"
            label = "100% GPU VRAM Fit"
            color = "emerald"
            reason = f"Fits entirely in GPU VRAM ({best_vram:.1f} GB available). Zero CPU latency."
            recommended = True
        elif best_vram >= min_vram * 0.7:
            grade = "good"
            label = "Good VRAM Fit"
            color = "blue"
            reason = f"Most layers offload to GPU VRAM ({best_vram:.1f} GB). Responsive generation."
            recommended = True
        elif avail_ram >= min_ram:
            grade = "usable"
            label = "CPU Offload (Usable)"
            color = "amber"
            reason = f"Fits in system RAM ({avail_ram:.1f} GB free). Runs on CPU with moderate speed."
            recommended = False
        elif total_ram >= min_ram:
            grade = "tight"
            label = "High RAM Pressure"
            color = "orange"
            reason = f"Requires {min_ram:.1f} GB RAM. Close background apps before running."
            recommended = False
        else:
            grade = "insufficient"
            label = "Insufficient Hardware"
            color = "rose"
            reason = f"Requires at least {min_ram:.1f} GB RAM. System has {total_ram:.1f} GB total."
            recommended = False

        return {
            "model": model_name,
            "grade": grade,
            "label": label,
            "color": color,
            "reason": reason,
            "recommended": recommended,
            "speed_estimate": reqs["tokens_per_sec"],
            "vram_required_gb": min_vram,
            "ram_required_gb": min_ram,
        }

    def audit_all(self, installed_models: Optional[List[str]] = None) -> Dict[str, Any]:
        """Produce full hardware audit report with model recommendations."""
        gpus = self.get_gpu_info()
        ram = self.get_system_ram()

        models_to_evaluate = list(MODEL_REQUIREMENTS.keys())
        if installed_models:
            for m in installed_models:
                if m not in models_to_evaluate:
                    models_to_evaluate.append(m)

        evaluations = [self.grade_model(m) for m in models_to_evaluate]
        recommended_model = next((e["model"] for e in evaluations if e["grade"] == "excellent"), None)
        if not recommended_model:
            recommended_model = next((e["model"] for e in evaluations if e["grade"] == "good"), "llama3.2:3b")

        return {
            "gpus": [{"name": g.name, "vram_gb": g.vram_gb, "is_dedicated": g.is_dedicated, "driver": g.driver_version} for g in gpus],
            "best_vram_gb": self.get_best_vram_gb(),
            "ram": ram,
            "recommended_model": recommended_model,
            "evaluations": evaluations,
        }


# Global instance
hardware_grader = HardwareGrader()

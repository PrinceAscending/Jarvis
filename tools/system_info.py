"""System diagnostic and process control tools for JARVIS."""

import os
import platform
import psutil
from typing import Optional
from tools.base import BaseTool, PermissionLevel, ToolResult


class GetSystemStatsTool(BaseTool):
    name = "get_system_stats"
    description = "Retrieve live real-time system performance stats: CPU usage, RAM utilization, Disk space, Battery, Network I/O, and OS version."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {},
        "required": []
    }

    async def execute(self) -> ToolResult:
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count(logical=True)
            vm = psutil.virtual_memory()
            disk = psutil.disk_usage("C:\\" if os.name == "nt" else "/")

            battery = psutil.sensors_battery()
            battery_info = None
            if battery:
                battery_info = {
                    "percent": battery.percent,
                    "power_plugged": battery.power_plugged,
                    "secs_left": battery.secsleft if battery.secsleft > 0 else None,
                }

            net_io = psutil.net_io_counters()

            stats = {
                "os": f"{platform.system()} {platform.release()} ({platform.version()})",
                "cpu": {
                    "usage_percent": cpu_percent,
                    "logical_cores": cpu_count,
                },
                "memory": {
                    "total_gb": round(vm.total / (1024**3), 2),
                    "used_gb": round(vm.used / (1024**3), 2),
                    "free_gb": round(vm.available / (1024**3), 2),
                    "percent": vm.percent,
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": disk.percent,
                },
                "battery": battery_info,
                "network": {
                    "bytes_sent_mb": round(net_io.bytes_sent / (1024**2), 2),
                    "bytes_recv_mb": round(net_io.bytes_recv / (1024**2), 2),
                }
            }

            return ToolResult(
                success=True,
                data=stats,
                message=f"System: CPU {cpu_percent}%, RAM {vm.percent}%, Disk {disk.percent}% used."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ListProcessesTool(BaseTool):
    name = "list_processes"
    description = "List top running Windows processes sorted by memory or CPU usage."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "limit": {"type": "integer", "description": "Number of top processes to return. Default is 15."},
            "sort_by": {"type": "string", "enum": ["memory", "cpu"], "description": "Sort by 'memory' or 'cpu'."}
        },
        "required": []
    }

    async def execute(self, limit: int = 15, sort_by: str = "memory") -> ToolResult:
        try:
            procs = []
            for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info']):
                try:
                    info = p.info
                    procs.append({
                        "pid": info['pid'],
                        "name": info['name'],
                        "cpu_percent": info['cpu_percent'] or 0.0,
                        "memory_mb": round(info['memory_info'].rss / (1024**2), 1) if info['memory_info'] else 0,
                        "memory_percent": round(info['memory_percent'] or 0.0, 1),
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            key = "memory_mb" if sort_by == "memory" else "cpu_percent"
            sorted_procs = sorted(procs, key=lambda x: x[key], reverse=True)[:limit]

            return ToolResult(
                success=True,
                data={"total_processes": len(procs), "top_processes": sorted_procs},
                message=f"Retrieved top {len(sorted_procs)} processes by {sort_by}."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class KillProcessTool(BaseTool):
    name = "kill_process"
    description = "Terminate a running process by its PID or process name."
    permission_level = PermissionLevel.HIGH
    parameters = {
        "type": "object",
        "properties": {
            "pid": {"type": "integer", "description": "Process ID to terminate."},
            "name": {"type": "string", "description": "Process name to terminate (e.g. 'notepad.exe')."}
        },
        "required": []
    }

    async def execute(self, pid: Optional[int] = None, name: Optional[str] = None) -> ToolResult:
        if pid is None and not name:
            return ToolResult(success=False, error="Must specify either 'pid' or 'name'.")

        try:
            killed = []
            if pid:
                p = psutil.Process(pid)
                p_name = p.name()
                p.terminate()
                killed.append(f"{p_name} (PID: {pid})")
            elif name:
                for p in psutil.process_iter(['pid', 'name']):
                    try:
                        if p.info['name'].lower() == name.lower():
                            p.terminate()
                            killed.append(f"{p.info['name']} (PID: {p.info['pid']})")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue

            if not killed:
                return ToolResult(success=False, error=f"No matching process found for PID={pid} Name={name}.")

            return ToolResult(
                success=True,
                data={"terminated": killed},
                message=f"Terminated: {', '.join(killed)}."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))

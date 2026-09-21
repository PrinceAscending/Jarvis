"""Proactive intelligence engine for JARVIS."""

import asyncio
from typing import Callable, Optional
import psutil
from config.settings import settings


class ProactiveEngine:
    """Monitors system status and triggers proactive alerts when appropriate."""

    def __init__(self, alert_callback: Optional[Callable] = None):
        self.alert_callback = alert_callback
        self._running = False
        self._last_battery_alert = False
        self._last_ram_alert = False

    async def start(self):
        self._running = True
        while self._running:
            try:
                if settings.get("automation", "proactive_enabled", True):
                    await self._check_signals()
            except Exception as e:
                print(f"[ProactiveEngine] Error in check: {e}")
            await asyncio.sleep(60)  # Check every minute

    def stop(self):
        self._running = False

    async def _check_signals(self):
        # 1. RAM pressure check
        vm = psutil.virtual_memory()
        if vm.percent > 90 and not self._last_ram_alert:
            self._last_ram_alert = True
            if self.alert_callback:
                await self.alert_callback(
                    "proactive_suggestion",
                    {
                        "type": "warning",
                        "title": "High Memory Usage Detected",
                        "message": f"RAM is at {vm.percent}%. Would you like me to inspect active processes and free up memory?",
                        "action_tool": "list_processes",
                        "action_args": {"limit": 5, "sort_by": "memory"}
                    }
                )
        elif vm.percent < 80:
            self._last_ram_alert = False

        # 2. Battery low alert
        battery = psutil.sensors_battery()
        if battery and not battery.power_plugged and battery.percent <= 15 and not self._last_battery_alert:
            self._last_battery_alert = True
            if self.alert_callback:
                await self.alert_callback(
                    "proactive_suggestion",
                    {
                        "type": "critical",
                        "title": "Low Battery Warning",
                        "message": f"Battery is down to {battery.percent}%. Please connect your AC power adapter.",
                    }
                )
        elif battery and (battery.power_plugged or battery.percent > 20):
            self._last_battery_alert = False

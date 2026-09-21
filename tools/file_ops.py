"""File and directory operations toolset for JARVIS."""

import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
from tools.base import BaseTool, PermissionLevel, ToolResult


class ListDirectoryTool(BaseTool):
    name = "list_directory"
    description = "List files and subdirectories inside a given directory with details (sizes, types, modification times)."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Absolute or relative path to the directory. Defaults to user home or current directory."},
            "max_items": {"type": "integer", "description": "Maximum number of items to return. Default is 50."}
        },
        "required": []
    }

    async def execute(self, path: Optional[str] = None, max_items: int = 50) -> ToolResult:
        try:
            target = Path(path).expanduser().resolve() if path else Path.home()
            if not target.exists():
                return ToolResult(success=False, error=f"Directory '{target}' does not exist.")
            if not target.is_dir():
                return ToolResult(success=False, error=f"'{target}' is a file, not a directory.")

            items = []
            for entry in list(target.iterdir())[:max_items]:
                try:
                    stat = entry.stat()
                    items.append({
                        "name": entry.name,
                        "is_dir": entry.is_dir(),
                        "size_bytes": stat.st_size if not entry.is_dir() else None,
                        "modified": stat.st_mtime,
                        "extension": entry.suffix.lower() if not entry.is_dir() else None,
                    })
                except Exception:
                    continue

            return ToolResult(
                success=True,
                data={"path": str(target), "total_found": len(items), "items": items},
                message=f"Listed {len(items)} items in '{target}'."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ReadFileTool(BaseTool):
    name = "read_file"
    description = "Read the contents of a text file (txt, md, py, json, csv, log, etc.)."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "Path to the file to read."},
            "max_lines": {"type": "integer", "description": "Max lines to return. Default 200."}
        },
        "required": ["file_path"]
    }

    async def execute(self, file_path: str, max_lines: int = 200) -> ToolResult:
        try:
            target = Path(file_path).expanduser().resolve()
            if not target.exists():
                return ToolResult(success=False, error=f"File '{target}' does not exist.")
            if target.is_dir():
                return ToolResult(success=False, error=f"'{target}' is a directory, not a file.")

            with open(target, "r", encoding="utf-8", errors="replace") as f:
                lines = [f.readline() for _ in range(max_lines)]
                content = "".join(lines)

            return ToolResult(
                success=True,
                data={"path": str(target), "content": content, "lines_read": len(lines)},
                message=f"Read {len(lines)} lines from '{target.name}'."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class WriteFileTool(BaseTool):
    name = "write_file"
    description = "Write text content to a file (creates or overwrites)."
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "Path to the file to write."},
            "content": {"type": "string", "description": "Text content to write."},
            "append": {"type": "boolean", "description": "If true, appends instead of overwriting."}
        },
        "required": ["file_path", "content"]
    }

    async def execute(self, file_path: str, content: str, append: bool = False) -> ToolResult:
        try:
            target = Path(file_path).expanduser().resolve()
            target.parent.mkdir(parents=True, exist_ok=True)
            mode = "a" if append else "w"
            with open(target, mode, encoding="utf-8") as f:
                f.write(content)

            return ToolResult(
                success=True,
                data={"path": str(target), "bytes_written": len(content)},
                message=f"Successfully {'appended to' if append else 'wrote'} '{target.name}'."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class DeleteFileTool(BaseTool):
    name = "delete_file"
    description = "Delete a specific file or folder."
    permission_level = PermissionLevel.HIGH
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Path to the file or directory to delete."},
            "recursive": {"type": "boolean", "description": "If true, recursively delete non-empty directory."}
        },
        "required": ["path"]
    }

    async def execute(self, path: str, recursive: bool = False) -> ToolResult:
        try:
            target = Path(path).expanduser().resolve()
            if not target.exists():
                return ToolResult(success=False, error=f"Target '{target}' does not exist.")

            if target.is_dir():
                if recursive:
                    shutil.rmtree(target)
                else:
                    target.rmdir()
            else:
                target.unlink()

            return ToolResult(
                success=True,
                data={"deleted_path": str(target)},
                message=f"Successfully deleted '{target.name}'."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class OrganizeFolderTool(BaseTool):
    name = "organize_folder"
    description = "Intelligently organize a directory (such as Downloads or Desktop) by sorting files into categorized subfolders (Documents, Images, Audio, Video, Archives, Code, Installers, Others)."
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "folder_path": {"type": "string", "description": "Path to the folder to organize (e.g. '~/Downloads' or '~/Desktop')."},
            "dry_run": {"type": "boolean", "description": "If true, simulates changes without moving files."}
        },
        "required": ["folder_path"]
    }

    CATEGORIES = {
        "Documents": {".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt", ".pptx", ".xlsx", ".csv", ".epub"},
        "Images": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff"},
        "Audio": {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma"},
        "Video": {".mp4", ".mkv", ".mov", ".avi", ".wmv", ".webm"},
        "Archives": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"},
        "Code": {".py", ".js", ".ts", ".html", ".css", ".json", ".xml", ".cpp", ".java", ".c", ".rs", ".go"},
        "Installers": {".exe", ".msi", ".bat", ".cmd", ".ps1"},
    }

    async def execute(self, folder_path: str, dry_run: bool = False) -> ToolResult:
        try:
            target = Path(folder_path).expanduser().resolve()
            if not target.is_dir():
                return ToolResult(success=False, error=f"'{target}' is not a valid directory.")

            actions_taken = []
            for item in target.iterdir():
                if item.is_dir():
                    continue  # Don't move already categorized folders

                ext = item.suffix.lower()
                dest_category = "Others"
                for category, extensions in self.CATEGORIES.items():
                    if ext in extensions:
                        dest_category = category
                        break

                category_dir = target / dest_category
                dest_file = category_dir / item.name

                # Prevent duplicate overwrites by adding (1), (2), etc.
                if dest_file.exists() and dest_file != item:
                    base_stem = item.stem
                    counter = 1
                    while dest_file.exists():
                        dest_file = category_dir / f"{base_stem} ({counter}){ext}"
                        counter += 1

                actions_taken.append({
                    "file": item.name,
                    "from": str(item),
                    "to_category": dest_category,
                    "destination": str(dest_file)
                })

                if not dry_run:
                    category_dir.mkdir(exist_ok=True)
                    shutil.move(str(item), str(dest_file))

            return ToolResult(
                success=True,
                data={
                    "folder": str(target),
                    "dry_run": dry_run,
                    "items_processed": len(actions_taken),
                    "actions": actions_taken
                },
                message=f"{'Simulated' if dry_run else 'Successfully'} organized {len(actions_taken)} files into category folders."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))

"""
Custom Exception Classes for Wais Wallet

Following opik-backend skill pattern: use specific exception classes
for different error scenarios to improve debugging and error handling.
"""

from fastapi import HTTPException


class WaisWalletException(Exception):
    """Base exception for all Wais Wallet errors"""
    pass


class DatabaseError(WaisWalletException):
    """Database operation failures (queries, connections, etc.)"""
    def __init__(self, message: str, query: str = None, table: str = None):
        self.query = query
        self.table = table
        super().__init__(message)


class ValidationError(WaisWalletException):
    """Input validation failures"""
    def __init__(self, message: str, field: str = None, value=None):
        self.field = field
        self.value = value
        super().__init__(message)


class AIServiceError(WaisWalletException):
    """AI/LLM service call failures"""
    def __init__(self, message: str, model: str = None, usage: dict = None):
        self.model = model
        self.usage = usage
        super().__init__(message)


class ToolExecutionError(WaisWalletException):
    """Agent tool execution failures"""
    def __init__(self, message: str, tool_name: str = None, args: dict = None):
        self.tool_name = tool_name
        self.args = args
        super().__init__(message)


# HTTP Exception utilities (FastAPI-compatible)
def bad_request(message: str) -> HTTPException:
    """400 Bad Request"""
    return HTTPException(status_code=400, detail=message)


def not_found(message: str) -> HTTPException:
    """404 Not Found"""
    return HTTPException(status_code=404, detail=message)


def internal_error(message: str) -> HTTPException:
    """500 Internal Server Error"""
    return HTTPException(status_code=500, detail=message)

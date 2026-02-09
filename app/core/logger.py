"""
Centralized Logging Configuration

Following opik-backend skill convention:
- Always quote values in logs (e.g., logger.info(f"Created wallet: '{wallet_id}'"))
- Structured logging for production, console for development
- Never log sensitive data (emails, passwords, tokens, API keys, PII)
"""

import logging
import sys
from typing import Optional

# Create logger
logger = logging.getLogger("waiswallet")


def setup_logger(level: str = "INFO", json_format: bool = False):
    """
    Configure the global logger
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: If True, output structured JSON logs (for production)
    """
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))
    
    # Format
    if json_format:
        # TODO: Add structured JSON formatter for production
        formatter = logging.Formatter(
            '{"timestamp":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}'
        )
    else:
        # Console format for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


# Initialize with defaults
setup_logger(level="INFO")


def log_tool_call(tool_name: str, **kwargs):
    """Helper for logging tool calls with consistent format"""
    args_str = ", ".join([f"{k}='{v}'" for k, v in kwargs.items()])
    logger.info(f"🔍 [Tool Call] {tool_name} | {args_str}")


def log_security_block(tool_name: str, reason: str, **kwargs):
    """Helper for logging security blocks"""
    args_str = ", ".join([f"{k}='{v}'" for k, v in kwargs.items()])
    logger.warning(f"⚠️ [Security Blocked] {tool_name} | {reason} | {args_str}")


def log_error(context: str, error: Exception, **kwargs):
    """Helper for logging errors with context"""
    args_str = ", ".join([f"{k}='{v}'" for k, v in kwargs.items()])
    logger.error(f"❌ [Error] {context} | {str(error)} | {args_str}", exc_info=True)

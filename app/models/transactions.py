from pydantic import BaseModel, Field
from typing import List, Optional

class ReceiptLineItem(BaseModel):
    category_id: int = Field(..., description="The ID from database.md (e.g., 1 for Groceries)")
    description: str = Field(..., description="Item name or description")
    line_amount: float = Field(..., description="Amount for this specific item")

class ReceiptExtraction(BaseModel):
    merchant: str = Field(..., description="Name of the store/merchant")
    transaction_date: str = Field(..., description="ISO8601 formatted date (YYYY-MM-DD)")
    total_amount: float = Field(..., description="Grand total of the receipt")
    items: List[ReceiptLineItem]
    suggested_wallet_id: Optional[int] = Field(None, description="Wallet ID matching the payment method used")
# Migrating opik_llm_judge.ipynb from OpenAI to Gemini API

This guide shows the changes needed to migrate the LLM judge notebook from OpenAI to Gemini API.

## Quick Start

I've created a Python script version with all changes already applied:
- **File**: `opik_llm_judge_gemini.py`
- **Ready to run** after you set up your Gemini API key

## Prerequisites Changes

### Old (OpenAI):
```bash
pip install opik openai python-dotenv
```

### New (Gemini):
```bash
pip install opik google-generativeai python-dotenv
```

## Environment Variable Changes

### Old:
```bash
export OPENAI_API_KEY="your-openai-key"
```

### New:
```bash
export GEMINI_API_KEY="your-gemini-key"
```

You can get a Gemini API key from: https://makersuite.google.com/app/apikey

## Code Changes

### 1. Import Statements

**Old (OpenAI):**
```python
from openai import OpenAI
```

**New (Gemini):**
```python
import google.generativeai as genai
```

### 2. Client Initialization

**Old (OpenAI):**
```python
# Initialize OpenAI for the judge LLM
judge_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
```

**New (Gemini):**
```python
# Initialize Gemini for the judge LLM
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
judge_model = genai.GenerativeModel('gemini-pro')
```

### 3. API Calls in Judge Classes

**Old (OpenAI):**
```python
response = judge_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": judge_prompt}],
    temperature=0,
    max_tokens=10
)

score_text = response.choices[0].message.content.strip()
```

**New (Gemini):**
```python
response = judge_model.generate_content(
    judge_prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0,
        max_output_tokens=10
    )
)

score_text = response.text.strip()
```

### 4. Apply to All Three Judge Classes

You need to apply the API call changes to:
- `FinancialAccuracyJudge.score()`
- `ToneJudge.score()`
- `HelpfulnessJudge.score()`

## Complete Example

Here's a complete `FinancialAccuracyJudge` class with Gemini:

```python
class FinancialAccuracyJudge(base_metric.BaseMetric):
    def __init__(self, name: str = "financial_accuracy"):
        super().__init__(name=name)
    
    def score(self, output: str, context: str = None, **kwargs) -> score_result.ScoreResult:
        judge_prompt = f"""You are a financial advisor expert evaluating AI-generated financial advice.

Evaluate the following response for financial accuracy:

USER QUERY: {context or 'Not provided'}
AI RESPONSE: {output}

Evaluation Criteria:
1. Is the financial advice sound and safe?
2. Does it avoid promoting risky behavior (e.g., using credit for cash, overspending)?
3. Are calculations or assessments accurate?
4. Does it promote responsible financial management?

Respond with ONLY a score from 0.0 to 1.0:
- 0.0 = Dangerous/incorrect financial advice
- 0.5 = Partially correct but room for improvement
- 1.0 = Excellent, accurate, and responsible advice

Your score:"""
        
        # CHANGED: Using Gemini instead of OpenAI
        response = judge_model.generate_content(
            judge_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0,
                max_output_tokens=10
            )
        )
        
        score_text = response.text.strip()
        
        try:
            score = float(score_text)
            score = max(0.0, min(1.0, score))
        except ValueError:
            score = 0.5
        
        return score_result.ScoreResult(
            value=score,
            name=self.name,
            reason=f"Financial accuracy score: {score:.2f}"
        )
```

## Using the Pre-Made Script

Instead of manually editing the notebook, you can use the ready-to-run script:

```bash
# 1. Install dependencies
pip install opik google-generativeai python-dotenv pandas matplotlib

# 2. Set your Gemini API key in .env file
echo "GEMINI_API_KEY=your-gemini-api-key-here" >> .env

# 3. Run the script
python opik_llm_judge_gemini.py
```

## Key Differences Between APIs

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| Package | `openai` | `google-generativeai` |
| Model Name | `gpt-4`, `gpt-3.5-turbo` | `gemini-pro`, `gemini-pro-vision` |
| API Style | Chat completions | Generate content |
| Response Access | `response.choices[0].message.content` | `response.text` |
| Config | Dict in function call | `GenerationConfig` object |

## Benefits of Gemini

1. **Free tier**: Generous free quota for testing
2. **Fast**: Lower latency for many use cases
3. **Cost-effective**: Generally cheaper than GPT-4
4. **Multimodal**: Native support for images (gemini-pro-vision)

## Notes

- The `gemini-pro` model is comparable to GPT-3.5/GPT-4 in quality
- Gemini API has a generous free tier (60 requests/minute)
- For production, consider using `gemini-1.5-pro` for better reasoning
- Error handling remains the same - both APIs can occasionally return non-numeric values

## Testing

After making changes, verify:
1. ✅ API key is correctly loaded from environment
2. ✅ All three judges return scores between 0.0 and 1.0
3. ✅ Bad financial advice (Test Case 4) gets low scores
4. ✅ Good financial advice gets high scores
5. ✅ Results are logged to Opik dashboard

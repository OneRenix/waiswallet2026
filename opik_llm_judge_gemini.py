"""
Creating a Custom LLM Judge with Opik for Wais Wallet (Using Gemini API)

This script demonstrates how to create a custom LLM-as-a-judge evaluation system 
using Opik with Google's Gemini API to evaluate the quality of Wais Wallet's AI Pilot responses.
"""

import os
import google.generativeai as genai
import opik
from opik import track
from opik.evaluation import evaluate
from opik.evaluation.metrics import base_metric, score_result
from dotenv import load_dotenv
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load environment variables
load_dotenv()

# Initialize Opik (this will create a local instance or connect to cloud)
opik_client = opik.Opik()

# Initialize Gemini for the judge LLM
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
judge_model = genai.GenerativeModel('gemini-pro')

print("✅ Opik and Gemini initialized successfully!")


# Custom LLM Judge Metrics

class FinancialAccuracyJudge(base_metric.BaseMetric):
    """
    Custom LLM judge that evaluates financial accuracy of AI responses.
    Scores from 0.0 (incorrect/harmful) to 1.0 (accurate and sound advice).
    """
    
    def __init__(self, name: str = "financial_accuracy"):
        super().__init__(name=name)
    
    def score(self, output: str, context: str = None, **kwargs) -> score_result.ScoreResult:
        """
        Evaluates financial accuracy using Gemini as a judge.
        
        Args:
            output: The AI's response to evaluate
            context: Optional context about the user's query
        
        Returns:
            ScoreResult with value between 0.0 and 1.0
        """
        
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
            score = max(0.0, min(1.0, score))  # Clamp to [0, 1]
        except ValueError:
            score = 0.5  # Default to neutral if parsing fails
        
        return score_result.ScoreResult(
            value=score,
            name=self.name,
            reason=f"Financial accuracy score: {score:.2f}"
        )

print("✅ FinancialAccuracyJudge defined")


class ToneJudge(base_metric.BaseMetric):
    """
    Custom LLM judge that evaluates tone: professional, witty, and frugal.
    """
    
    def __init__(self, name: str = "tone_quality"):
        super().__init__(name=name)
    
    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        judge_prompt = f"""You are a communication expert evaluating AI response tone.

Evaluate this response:
{output}

Criteria:
1. Professional yet approachable
2. Witty and engaging (uses metaphors/creative language)
3. Frugal mindset (promotes smart financial choices)

Score from 0.0 to 1.0:
- 0.0 = Dry, boring, or unprofessional
- 0.5 = Adequate but lacks personality
- 1.0 = Perfect balance of professional, witty, and frugal

Your score:"""
        
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
            reason=f"Tone quality score: {score:.2f}"
        )

print("✅ ToneJudge defined")


class HelpfulnessJudge(base_metric.BaseMetric):
    """
    Custom LLM judge that evaluates if the response actually helps the user.
    """
    
    def __init__(self, name: str = "helpfulness"):
        super().__init__(name=name)
    
    def score(self, output: str, context: str = None, **kwargs) -> score_result.ScoreResult:
        judge_prompt = f"""You are evaluating if an AI response is helpful.

USER QUERY: {context or 'Not provided'}
AI RESPONSE: {output}

Criteria:
1. Directly addresses the user's question
2. Provides actionable insights or clear answers
3. Explains reasoning (not just "yes" or "no")

Score from 0.0 to 1.0:
- 0.0 = Unhelpful, off-topic, or confusing
- 0.5 = Somewhat helpful but incomplete
- 1.0 = Extremely helpful, clear, and actionable

Your score:"""
        
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
            reason=f"Helpfulness score: {score:.2f}"
        )

print("✅ HelpfulnessJudge defined")


# Create Evaluation Dataset

evaluation_dataset = [
    {
        "input": "I want to buy a second-hand car for ₱180,000 in cash. Can I afford it?",
        "output": "Hold your horses! Your cash and debit wallets currently total ₱83,450. To buy that ₱180,000 car, you'd be quite a bit short. Dipping into credit for a cash purchase is a slippery slope to a debt spiral; it's always best to save up for big buys to keep your financial house in order.",
        "expected_quality": "high"  # We expect high scores across all metrics
    },
    {
        "input": "What's my total balance across all wallets?",
        "output": "Your total financial well-being, a true treasure chest, stands at a robust $163,099! Keep nurturing those funds; every penny saved is a future freedom earned.",
        "expected_quality": "high"
    },
    {
        "input": "Should I use my credit card or debit for groceries?",
        "output": "Use your credit card if it offers cashback on groceries, but only if you pay the full balance monthly. Otherwise, it's a bumpy road with high interest. Debit keeps your budget grounded.",
        "expected_quality": "high"
    },
    {
        "input": "Can I withdraw cash using my credit card?",
        "output": "Go ahead and withdraw cash with your credit card!",  # BAD ADVICE - should score low
        "expected_quality": "low"  # Expected to fail financial accuracy
    }
]

print(f"✅ Created evaluation dataset with {len(evaluation_dataset)} test cases")


# Initialize judges
financial_judge = FinancialAccuracyJudge()
tone_judge = ToneJudge()
helpfulness_judge = HelpfulnessJudge()


# Function to evaluate a single response
@track
def evaluate_response(input_query: str, output_response: str):
    """
    Evaluates a single AI response using all three judges.
    Opik's @track decorator automatically logs this to the Opik platform.
    """
    
    # Score with each judge
    financial_score = financial_judge.score(output=output_response, context=input_query)
    tone_score = tone_judge.score(output=output_response)
    helpfulness_score = helpfulness_judge.score(output=output_response, context=input_query)
    
    return {
        "input": input_query,
        "output": output_response,
        "financial_accuracy": financial_score.value,
        "tone_quality": tone_score.value,
        "helpfulness": helpfulness_score.value,
        "average_score": (financial_score.value + tone_score.value + helpfulness_score.value) / 3
    }

print("✅ Evaluation function defined with Opik tracking")


# Run evaluation on all test cases
def run_evaluations():
    results = []
    
    print("\n🚀 Running LLM Judge Evaluations...\n")
    
    for i, test_case in enumerate(evaluation_dataset, 1):
        print(f"📝 Test Case {i}/{len(evaluation_dataset)}")
        print(f"Query: {test_case['input'][:60]}...")
        
        result = evaluate_response(
            input_query=test_case['input'],
            output_response=test_case['output']
        )
        
        result['expected_quality'] = test_case['expected_quality']
        results.append(result)
        
        print(f"   📊 Financial Accuracy: {result['financial_accuracy']:.2f}")
        print(f"   📊 Tone Quality: {result['tone_quality']:.2f}")
        print(f"   📊 Helpfulness: {result['helpfulness']:.2f}")
        print(f"   ⭐ Average Score: {result['average_score']:.2f}")
        print()
    
    print("✅ Evaluation complete! Results logged to Opik.")
    return results


# Analyze Results
def analyze_results(results):
    df = pd.DataFrame(results)
    
    print("\n📈 EVALUATION SUMMARY\n")
    print("=" * 80)
    
    # Overall averages
    print(f"\n🎯 Overall Metrics:")
    print(f"   Financial Accuracy: {df['financial_accuracy'].mean():.2f} (±{df['financial_accuracy'].std():.2f})")
    print(f"   Tone Quality:       {df['tone_quality'].mean():.2f} (±{df['tone_quality'].std():.2f})")
    print(f"   Helpfulness:        {df['helpfulness'].mean():.2f} (±{df['helpfulness'].std():.2f})")
    print(f"   Average Score:      {df['average_score'].mean():.2f}")
    
    # Group by expected quality
    print(f"\n📊 By Expected Quality:")
    grouped = df.groupby('expected_quality')[['financial_accuracy', 'tone_quality', 'helpfulness', 'average_score']].mean()
    print(grouped)
    
    # Display full results table
    print(f"\n📋 Detailed Results:")
    print(df[['input', 'financial_accuracy', 'tone_quality', 'helpfulness', 'average_score', 'expected_quality']].to_string())
    
    return df


# Visualize Results
def visualize_results(df):
    results = df.to_dict('records')
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # 1. Metric comparison across test cases
    x = np.arange(len(results))
    width = 0.25
    
    axes[0].bar(x - width, df['financial_accuracy'], width, label='Financial Accuracy', alpha=0.8)
    axes[0].bar(x, df['tone_quality'], width, label='Tone Quality', alpha=0.8)
    axes[0].bar(x + width, df['helpfulness'], width, label='Helpfulness', alpha=0.8)
    
    axes[0].set_xlabel('Test Case')
    axes[0].set_ylabel('Score')
    axes[0].set_title('LLM Judge Scores by Test Case')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels([f"Test {i+1}" for i in range(len(results))])
    axes[0].legend()
    axes[0].grid(axis='y', alpha=0.3)
    axes[0].set_ylim(0, 1.1)
    
    # 2. Average scores by quality expectation
    quality_groups = df.groupby('expected_quality')['average_score'].mean()
    colors = ['#ff6b6b' if q == 'low' else '#51cf66' for q in quality_groups.index]
    
    axes[1].bar(quality_groups.index, quality_groups.values, color=colors, alpha=0.8)
    axes[1].set_xlabel('Expected Quality')
    axes[1].set_ylabel('Average Score')
    axes[1].set_title('Average Score by Expected Quality')
    axes[1].grid(axis='y', alpha=0.3)
    axes[1].set_ylim(0, 1.1)
    
    plt.tight_layout()
    plt.savefig('/Users/ultrenzv/Documents/DEV/waiswallet/evaluation_results.png', dpi=300)
    print("✅ Visualization saved to evaluation_results.png")
    plt.show()


# Using Opik's Built-in Evaluation Framework
def run_opik_evaluation():
    # Define the task (wraps your AI application)
    def wais_wallet_task(input_data):
        """Simulates calling the Wais Wallet AI Pilot"""
        # In a real scenario, this would call your actual API
        # For now, we'll return the pre-recorded responses
        for test_case in evaluation_dataset:
            if test_case['input'] == input_data['input']:
                return {"output": test_case['output']}
        return {"output": "Unable to process request"}
    
    # Run Opik's evaluate function
    evaluation_results = evaluate(
        dataset=evaluation_dataset,
        task=wais_wallet_task,
        scoring_metrics=[financial_judge, tone_judge, helpfulness_judge],
        experiment_name="wais_wallet_llm_judge_gemini_v1"
    )
    
    print("\n✅ Opik evaluation complete!")
    print(f"📊 Results logged to experiment: wais_wallet_llm_judge_gemini_v1")
    print(f"🔗 View in Opik UI: http://localhost:5000 (if running locally)")


if __name__ == "__main__":
    # Run the evaluation
    results = run_evaluations()
    
    # Analyze results
    df = analyze_results(results)
    
    # Visualize results
    visualize_results(df)
    
    # Run Opik's built-in evaluation
    print("\n" + "="*80)
    print("Running Opik's Built-in Evaluation Framework...")
    print("="*80)
    run_opik_evaluation()
    
    print("\n" + "="*80)
    print("📚 Key Takeaways:")
    print("="*80)
    print("""
    What We Built:
    1. Three Custom LLM Judges using Gemini API:
       - Financial Accuracy Judge
       - Tone Quality Judge
       - Helpfulness Judge
    
    2. Automated Evaluation Pipeline:
       - Batch evaluation of AI responses
       - Opik tracking and logging
       - Visualization of results
    
    3. Quality Assurance Framework:
       - Can detect poor financial advice (e.g., Test Case 4)
       - Validates tone and helpfulness
       - Provides quantitative metrics for A/B testing prompts
    
    Next Steps:
    - Integrate this into CI/CD for automated testing
    - Use judge scores to compare different prompt versions
    - Create alerts when scores drop below thresholds
    - Expand dataset with real user queries
    
    Benefits:
    - Objective Evaluation: Consistent scoring across experiments
    - Scalable: Can evaluate thousands of responses automatically
    - Traceable: Opik tracks all evaluations for future analysis
    - Flexible: Easy to add new judges for different criteria
    """)

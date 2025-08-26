// =============================================
// HUGGING FACE INFERENCE API INTEGRATION
// For AI text generation using openai/gpt-oss-20b model
// =============================================

interface HFTextGenerationResponse {
  generated_text: string;
  finish_reason?: string;
}

interface HFError {
  error: string;
  estimated_time?: number;
}

export async function hfTextGenerate(
  prompt: string,
  options: {
    max_length?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    return_full_text?: boolean;
  } = {}
): Promise<string> {
  const HF_TOKEN = process.env.HF_TOKEN;
  const HF_MODEL = process.env.HF_MODEL || 'openai/gpt-oss-20b';
  
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN environment variable is required');
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: options.max_length || 500,
              temperature: options.temperature || 0.7,
              top_p: options.top_p || 0.9,
              repetition_penalty: options.repetition_penalty || 1.1,
              return_full_text: options.return_full_text || false,
              do_sample: true,
            },
            options: {
              wait_for_model: true,
              use_cache: false,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as HFError;
        
        // If model is loading, wait and retry
        if (errorData.estimated_time && retryCount < maxRetries - 1) {
          console.log(`Model loading, waiting ${errorData.estimated_time}s...`);
          await new Promise(resolve => setTimeout(resolve, (errorData.estimated_time || 20) * 1000));
          retryCount++;
          continue;
        }
        
        throw new Error(`HF API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json() as HFTextGenerationResponse[];
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response from Hugging Face API');
      }

      const generatedText = data[0].generated_text;
      
      if (!generatedText) {
        throw new Error('No text generated from Hugging Face API');
      }

      // Clean up the generated text
      return generatedText
        .trim()
        .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
        .replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

    } catch (error) {
      retryCount++;
      console.error(`HF API attempt ${retryCount} failed:`, error);
      
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to generate text after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }

  throw new Error('Unexpected error in HF text generation');
}

// Helper function for AI insight generation
export async function generateAIInsight(
  module: string,
  dataContext: any,
  promptType: 'summary' | 'prediction' | 'recommendation' | 'risk_analysis' = 'summary'
): Promise<string> {
  try {
    let prompt = '';
    
    switch (promptType) {
      case 'summary':
        prompt = `As an AI analyst for a mining commodity trading company, analyze the following ${module} data and provide a concise business summary:

Data Context: ${JSON.stringify(dataContext, null, 2)}

Provide insights on:
1. Current performance status
2. Key trends identified
3. Notable patterns or anomalies
4. Business impact assessment

Keep response under 200 words and focus on actionable insights.`;
        break;
        
      case 'prediction':
        prompt = `As an AI forecasting expert for mining commodities, analyze this ${module} data and generate predictions:

Data Context: ${JSON.stringify(dataContext, null, 2)}

Provide:
1. Short-term forecast (1-3 months)
2. Confidence level and reasoning
3. Key factors influencing predictions
4. Potential risks to forecast accuracy

Keep response under 250 words and be specific about numbers when possible.`;
        break;
        
      case 'recommendation':
        prompt = `As an AI business advisor for a mining trading company, review this ${module} data and provide strategic recommendations:

Data Context: ${JSON.stringify(dataContext, null, 2)}

Provide:
1. Top 3 actionable recommendations
2. Priority level for each recommendation
3. Expected business impact
4. Implementation considerations

Keep response under 200 words and focus on practical actions.`;
        break;
        
      case 'risk_analysis':
        prompt = `As an AI risk analyst for mining commodities, evaluate potential risks in this ${module} data:

Data Context: ${JSON.stringify(dataContext, null, 2)}

Identify:
1. High-priority risks detected
2. Risk probability and impact assessment
3. Early warning indicators
4. Mitigation strategies

Keep response under 250 words and quantify risks where possible.`;
        break;
    }

    const insight = await hfTextGenerate(prompt, {
      max_length: 300,
      temperature: 0.6,
      top_p: 0.85,
      repetition_penalty: 1.15
    });

    return insight;
    
  } catch (error) {
    console.error('Error generating AI insight:', error);
    
    // Fallback response
    return `AI analysis temporarily unavailable. Manual review recommended for ${module} data. Key metrics show ${JSON.stringify(dataContext).length > 100 ? 'significant activity' : 'normal activity'} requiring attention.`;
  }
}

// Specialized function for commodity market analysis
export async function generateMarketAnalysis(commodityData: any): Promise<{
  summary: string;
  trends: string;
  predictions: string;
  risks: string;
}> {
  try {
    const [summary, trends, predictions, risks] = await Promise.all([
      generateAIInsight('market', commodityData, 'summary'),
      generateAIInsight('trends', commodityData, 'summary'), 
      generateAIInsight('forecasting', commodityData, 'prediction'),
      generateAIInsight('risk', commodityData, 'risk_analysis')
    ]);

    return {
      summary,
      trends,
      predictions,
      risks
    };
    
  } catch (error) {
    console.error('Error generating market analysis:', error);
    
    return {
      summary: 'Market analysis temporarily unavailable due to AI service issues.',
      trends: 'Trend analysis pending. Manual review recommended.',
      predictions: 'Predictions unavailable. Refer to historical patterns.',
      risks: 'Risk assessment pending. Monitor market conditions closely.'
    };
  }
}

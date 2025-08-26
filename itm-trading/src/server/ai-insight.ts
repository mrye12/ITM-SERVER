// =============================================
// AI INSIGHT PROMPT TEMPLATES
// Structured prompts for different business modules
// =============================================

export interface AIInsightRequest {
  module: string;
  aggregates: any;
  timeframe: string;
  additional_context?: any;
}

export interface AIInsightResponse {
  summary: string;
  key_metrics: Array<{
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>;
  predictions: Array<{
    timeframe: string;
    forecast: string;
    confidence: number;
  }>;
  risks: Array<{
    risk: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
  }>;
  actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    impact: string;
  }>;
}

export function buildPrompt(request: AIInsightRequest): string {
  const { module, aggregates, timeframe, additional_context } = request;
  
  const basePrompt = `You are an AI business analyst for ITM Trading, a mining commodity trading company. Analyze the following ${module} data and provide structured business insights.

COMPANY CONTEXT:
- Mining commodity trading (coal, nickel, iron ore, copper, bauxite)
- International operations with complex supply chains
- Focus on operational efficiency and risk management

DATA TO ANALYZE:
Module: ${module}
Timeframe: ${timeframe}
Key Metrics: ${JSON.stringify(aggregates, null, 2)}
${additional_context ? `Additional Context: ${JSON.stringify(additional_context, null, 2)}` : ''}

ANALYSIS REQUIREMENTS:
Provide insights in this exact JSON format:

{
  "summary": "3-4 sentence executive summary of current status and key findings",
  "key_metrics": [
    {
      "label": "Metric name",
      "value": "Current value with units",
      "trend": "up/down/stable",
      "significance": "high/medium/low"
    }
  ],
  "predictions": [
    {
      "timeframe": "Next 30 days/Quarter/etc",
      "forecast": "Specific prediction with reasoning",
      "confidence": 0.85
    }
  ],
  "risks": [
    {
      "risk": "Specific risk description",
      "impact": "high/medium/low", 
      "probability": 0.6
    }
  ],
  "actions": [
    {
      "action": "Specific actionable recommendation",
      "priority": "urgent/high/medium/low",
      "impact": "Expected business impact"
    }
  ]
}

SPECIFIC FOCUS AREAS FOR ${module.toUpperCase()}:`;

  // Add module-specific prompts
  switch (module.toLowerCase()) {
    case 'fuel':
    case 'fuel_operations':
      return basePrompt + `
- Fuel consumption efficiency trends
- Cost optimization opportunities  
- Supply chain reliability
- Equipment maintenance correlation
- Environmental compliance status
- Seasonal usage patterns

Focus on operational KPIs, cost management, and supply security.`;

    case 'shipments':
    case 'logistics':
      return basePrompt + `
- Delivery performance and on-time rates
- Route optimization opportunities
- Port congestion and delays
- Shipping cost trends
- Cargo handling efficiency
- International trade compliance

Focus on logistics efficiency, cost optimization, and delivery reliability.`;

    case 'sales':
    case 'trading':
      return basePrompt + `
- Revenue performance vs targets
- Commodity price trends impact
- Customer concentration risks
- Market share analysis
- Profit margin optimization
- Payment terms and cash flow

Focus on revenue growth, profitability, and market positioning.`;

    case 'inventory':
    case 'stock':
      return basePrompt + `
- Stock level optimization
- Turnover rate analysis
- Carrying cost management
- Stockout risk assessment
- Demand forecasting accuracy
- Warehouse efficiency

Focus on inventory optimization, carrying costs, and demand planning.`;

    case 'equipment':
    case 'maintenance':
      return basePrompt + `
- Equipment uptime and availability
- Maintenance cost trends
- Predictive maintenance opportunities
- Asset utilization rates
- Breakdown patterns
- Replacement scheduling

Focus on asset reliability, maintenance optimization, and operational continuity.`;

    case 'finance':
    case 'financial':
      return basePrompt + `
- Cash flow management
- Working capital optimization
- Currency exposure risks
- Credit facility utilization
- Investment performance
- Financial ratio analysis

Focus on liquidity management, financial health, and risk mitigation.`;

    case 'compliance':
    case 'regulatory':
      return basePrompt + `
- Regulatory compliance status
- Environmental monitoring
- Safety incident trends
- Audit findings
- Policy adherence
- Training requirements

Focus on compliance gaps, risk mitigation, and operational safety.`;

    case 'hr':
    case 'human_resources':
      return basePrompt + `
- Workforce productivity trends
- Turnover and retention rates
- Training effectiveness
- Safety performance
- Compensation competitiveness
- Skill gap analysis

Focus on talent management, productivity, and workplace safety.`;

    default:
      return basePrompt + `
- Overall performance indicators
- Operational efficiency metrics
- Cost management opportunities
- Risk factors identification
- Strategic recommendations
- Resource optimization

Focus on operational excellence and strategic business insights.`;
  }
}

// Helper function to validate AI response structure
export function validateAIResponse(response: string): AIInsightResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIInsightResponse;
    
    // Validate required fields
    if (!parsed.summary || !parsed.key_metrics || !parsed.predictions || !parsed.risks || !parsed.actions) {
      throw new Error('Missing required fields in AI response');
    }

    // Validate arrays
    if (!Array.isArray(parsed.key_metrics) || !Array.isArray(parsed.predictions) || 
        !Array.isArray(parsed.risks) || !Array.isArray(parsed.actions)) {
      throw new Error('Invalid array fields in AI response');
    }

    return parsed;
    
  } catch (error) {
    console.error('Error validating AI response:', error);
    
    // Return fallback response
    return {
      summary: "AI analysis completed but response format requires manual review. Key operational metrics show normal activity patterns.",
      key_metrics: [
        {
          label: "System Status",
          value: "Operational",
          trend: "stable",
          significance: "medium"
        }
      ],
      predictions: [
        {
          timeframe: "Next 30 days",
          forecast: "Continued operational stability expected based on historical patterns",
          confidence: 0.7
        }
      ],
      risks: [
        {
          risk: "AI analysis limitations - manual review recommended",
          impact: "medium",
          probability: 0.8
        }
      ],
      actions: [
        {
          action: "Review data quality and AI service configuration",
          priority: "medium",
          impact: "Improved analytical capabilities"
        }
      ]
    };
  }
}

// Generate contextual prompt based on data patterns
export function generateContextualPrompt(module: string, data: any): string {
  const dataSize = JSON.stringify(data).length;
  const hasRecentData = data.created_at && new Date(data.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  let contextualNote = '';
  
  if (dataSize > 5000) {
    contextualNote += ' Note: Large dataset detected - focus on high-level trends and key insights.';
  }
  
  if (hasRecentData) {
    contextualNote += ' Note: Recent data available - emphasize current trends and immediate actions.';
  }
  
  if (Object.keys(data).length < 3) {
    contextualNote += ' Note: Limited data available - provide broader industry context and recommendations.';
  }

  return buildPrompt({
    module,
    aggregates: data,
    timeframe: 'Current period',
    additional_context: { note: contextualNote }
  });
}

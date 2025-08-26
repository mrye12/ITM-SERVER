// itm-trading/src/app/api/compliance/check/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ComplianceCheckRequest {
  commodity_id: string;
  commodity_name?: string;
  hs_code?: string;
  destination_country: string;
  quantity: number;
  unit: string;
  buyer_info?: {
    name: string;
    country: string;
    is_new_buyer: boolean;
  };
  transaction_value?: number;
  currency?: string;
}

interface ComplianceResult {
  status: 'allowed' | 'conditional' | 'prohibited' | 'review_required';
  risk_score: number;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  compliance_summary: string;
  required_documents: string[];
  regulatory_notes: string[];
  restrictions: string[];
  recommendations: string[];
  estimated_costs?: {
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
}

// Mock compliance engine for demonstration
async function checkExportCompliance(request: ComplianceCheckRequest): Promise<ComplianceResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock commodity regulations
  const commodityRules: Record<string, any> = {
    '1': { // COAL-THERMAL
      status: 'conditional',
      risk_base: 3.5,
      required_docs: ['ET (Eksportir Terdaftar)', 'LS (Laporan Surveyor)', 'DMO Certificate (25%)'],
      restrictions: ['DMO 25% untuk pasar domestik wajib dipenuhi', 'Surveyor report mandatory untuk kualitas'],
      recommendations: ['Pastikan stok DMO tersedia', 'Siapkan dokumen surveyor independen']
    },
    '2': { // FERRO-NICKEL
      status: 'allowed',
      risk_base: 2.0,
      required_docs: ['ET (Eksportir Terdaftar)', 'COA (Certificate of Analysis)'],
      restrictions: [],
      recommendations: ['Pastikan kandungan Fe-Ni sesuai standar internasional']
    },
    '3': { // NICKEL-ORE
      status: 'prohibited',
      risk_base: 10.0,
      required_docs: [],
      restrictions: ['Bijih nikel mentah dilarang ekspor sesuai Permendag terbaru', 'Hanya produk olahan yang diizinkan'],
      recommendations: ['Proses menjadi ferro nickel atau NPI terlebih dahulu']
    },
    '4': { // TIN-INGOT
      status: 'conditional',
      risk_base: 4.0,
      required_docs: ['ET (Eksportir Terdaftar)', 'ICDX Certificate', 'Tin Purity Certificate'],
      restrictions: ['Wajib melalui bursa ICDX', 'Kemurnian minimum 99.9%'],
      recommendations: ['Registrasi di ICDX terlebih dahulu', 'Pastikan sertifikat kemurnian valid']
    }
  };

  const commodity = commodityRules[request.commodity_id] || {
    status: 'review_required',
    risk_base: 5.0,
    required_docs: ['Manual review required'],
    restrictions: ['Komoditas tidak dikenali dalam database'],
    recommendations: ['Hubungi compliance officer untuk review manual']
  };

  // Calculate risk score
  let riskScore = commodity.risk_base;
  
  // Risk factors
  if (request.buyer_info?.is_new_buyer) riskScore += 1.5;
  if (request.transaction_value && request.transaction_value > 1000000) riskScore += 1.0;
  if (['IRAN', 'NORTH_KOREA', 'SYRIA'].includes(request.destination_country.toUpperCase())) riskScore += 3.0;
  if (request.quantity > 10000) riskScore += 0.5;

  // Cap risk score
  riskScore = Math.min(10, Math.max(0, riskScore));

  // Determine risk level
  let riskLevel: ComplianceResult['risk_level'];
  if (riskScore <= 2) riskLevel = 'very_low';
  else if (riskScore <= 4) riskLevel = 'low';
  else if (riskScore <= 6) riskLevel = 'medium';
  else if (riskScore <= 8) riskLevel = 'high';
  else riskLevel = 'very_high';

  // Generate compliance summary
  const summaries: Record<string, string> = {
    allowed: `${request.commodity_name || 'Komoditas'} dapat diekspor ke ${request.destination_country} dengan memenuhi dokumen standar.`,
    conditional: `${request.commodity_name || 'Komoditas'} dapat diekspor ke ${request.destination_country} dengan memenuhi persyaratan tambahan.`,
    prohibited: `${request.commodity_name || 'Komoditas'} dilarang untuk ekspor sesuai regulasi Indonesia.`,
    review_required: `${request.commodity_name || 'Komoditas'} memerlukan review manual untuk penentuan status ekspor.`
  };

  // Estimate costs (mock calculation)
  let estimatedCosts;
  if (request.transaction_value && commodity.status !== 'prohibited') {
    const baseValue = request.transaction_value;
    const ppn = 0; // Export usually exempt
    const beaKeluar = request.commodity_id === '1' ? baseValue * 0.07 : // Coal 7%
                      request.commodity_id === '4' ? baseValue * 0.05 : // Tin 5%
                      0; // Others 0%
    const fees = baseValue * 0.001; // Admin fees 0.1%
    
    estimatedCosts = {
      taxes: ppn + beaKeluar,
      fees,
      total: ppn + beaKeluar + fees,
      currency: request.currency || 'USD'
    };
  }

  return {
    status: commodity.status,
    risk_score: Number(riskScore.toFixed(1)),
    risk_level: riskLevel,
    compliance_summary: summaries[commodity.status] || summaries.review_required,
    required_documents: commodity.required_docs,
    regulatory_notes: commodity.restrictions,
    restrictions: commodity.restrictions,
    recommendations: commodity.recommendations,
    estimated_costs: estimatedCosts
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ComplianceCheckRequest = await request.json();

    // Validate required fields
    if (!body.commodity_id || !body.destination_country || !body.quantity) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required fields: commodity_id, destination_country, quantity'
      }, { status: 400 });
    }

    console.log(`Processing compliance check for commodity ${body.commodity_id} to ${body.destination_country}`);

    const startTime = Date.now();
    const result = await checkExportCompliance(body);
    const processingTime = Date.now() - startTime;

    console.log(`Compliance check completed in ${processingTime}ms with status: ${result.status}`);

    return NextResponse.json({
      ok: true,
      result,
      processing_time_ms: processingTime
    });

  } catch (error: any) {
    console.error('Compliance check API error:', error);

    return NextResponse.json({
      ok: false,
      error: error.message || 'Internal server error during compliance check'
    }, { status: 500 });
  }
}

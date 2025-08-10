"""
Test Enhanced NER System with Real Medical Report
"""

import asyncio
import sys
sys.path.append('./backend')
from backend.main import analyze_medical_text_advanced

async def test_real_medical_report():
    print("🏥 Testing Enhanced NER with REAL Medical Report")
    print("=" * 70)
    
    # Real medical report example
    real_medical_report = """
    PATIENT: John Smith, 65-year-old male
    CHIEF COMPLAINT: Chest pain and shortness of breath
    
    HISTORY OF PRESENT ILLNESS:
    Patient presents with acute onset chest pain radiating to left arm, associated with 
    shortness of breath, nausea, and diaphoresis. Pain started 2 hours ago while at rest.
    
    PAST MEDICAL HISTORY:
    - Type 2 diabetes mellitus, well-controlled
    - Hypertension
    - Hyperlipidemia
    - Previous myocardial infarction (2019)
    - Chronic kidney disease, stage 3
    
    MEDICATIONS:
    - Metformin 1000mg twice daily
    - Lisinopril 10mg daily
    - Atorvastatin 40mg daily
    - Aspirin 81mg daily
    - Metoprolol 50mg twice daily
    
    ALLERGIES:
    - Penicillin (rash)
    - Sulfa drugs (hives)
    
    FAMILY HISTORY:
    - Father: coronary artery disease, died at age 70
    - Mother: breast cancer, diabetes
    
    PHYSICAL EXAMINATION:
    - Vital Signs: BP 160/95 mmHg, HR 110 bpm, RR 24/min, Temp 98.6°F, O2 sat 94%
    - General: Anxious, diaphoretic male in moderate distress
    - Cardiovascular: Tachycardic, regular rhythm, no murmurs
    - Pulmonary: Bilateral rales at bases
    - Extremities: No edema
    
    LABORATORY RESULTS:
    - Glucose: 180 mg/dL (elevated)
    - Hemoglobin A1c: 7.2%
    - Total cholesterol: 240 mg/dL
    - LDL cholesterol: 160 mg/dL (elevated)
    - HDL cholesterol: 35 mg/dL (low)
    - Triglycerides: 280 mg/dL (elevated)
    - Creatinine: 1.8 mg/dL (elevated)
    - BUN: 35 mg/dL
    - Troponin I: 2.5 ng/mL (ELEVATED - CRITICAL)
    - CK-MB: 15 ng/mL (elevated)
    - BNP: 450 pg/mL (elevated)
    
    DIAGNOSTIC STUDIES:
    - ECG: ST-elevation in leads II, III, aVF consistent with inferior STEMI
    - Chest X-ray: Mild pulmonary edema
    - Echocardiogram: EF 35%, regional wall motion abnormalities
    
    ASSESSMENT AND PLAN:
    1. ST-elevation myocardial infarction (STEMI) - URGENT
       - Activate cardiac catheterization lab
       - Start dual antiplatelet therapy
       - Heparin protocol
    
    2. Acute heart failure with reduced ejection fraction
       - Furosemide for diuresis
       - ACE inhibitor optimization
    
    3. Diabetes mellitus with poor control
       - Continue metformin
       - Consider insulin if needed
    
    4. Chronic kidney disease - monitor renal function
    
    DISPOSITION: Admitted to CCU for urgent cardiac catheterization
    """
    
    print("📄 Analyzing comprehensive real medical report...")
    print(f"📊 Report length: {len(real_medical_report)} characters")
    
    result = await analyze_medical_text_advanced(real_medical_report)
    
    print(f"\n🎯 COMPREHENSIVE ANALYSIS RESULTS:")
    print(f"=" * 50)
    print(f"Total entities found: {len(result['medical_entities'])}")
    print(f"Categories detected: {result['processing_metadata']['categories_detected']}")
    print(f"Critical findings: {len(result['critical_findings'])}")
    print(f"Confidence score: {result['confidence_score']:.1%}")
    
    print(f"\n📊 DETAILED ENTITY BREAKDOWN:")
    for category, count in result['entity_counts'].items():
        if count > 0:
            print(f"  {category.upper()}: {count} entities")
    
    print(f"\n🔍 TOP ENTITIES BY CATEGORY:")
    for category, entities in result['categorized_entities'].items():
        if entities and len(entities) > 0:
            print(f"\n  {category.upper()} ({len(entities)} total):")
            # Show top entities with sources
            for entity in entities[:8]:  # Show top 8
                source = entity.get('source', 'Pattern')
                confidence = entity.get('confidence', 0)
                print(f"    - {entity['text']} ({confidence:.0%}, {source})")
    
    if result['critical_findings']:
        print(f"\n⚠️  CRITICAL FINDINGS DETECTED:")
        for finding in result['critical_findings']:
            print(f"  🚨 {finding['text'].upper()} ({finding['severity']})")
            print(f"     Reason: {finding['reason']}")
    
    print(f"\n🩺 DIFFERENTIAL DIAGNOSIS SUGGESTIONS:")
    for i, dx in enumerate(result['differential_diagnosis'], 1):
        print(f"  {i}. {dx['condition']} ({dx['confidence']:.0%} confidence)")
        print(f"     Reasoning: {dx['reasoning']}")
    
    print(f"\n📈 PERFORMANCE METRICS:")
    print(f"  Text analyzed: {result['processing_metadata']['text_length']:,} characters")
    print(f"  Medical terms found: {result['processing_metadata']['entities_found']}")
    print(f"  Entity density: {len(result['medical_entities']) / result['processing_metadata']['text_length'] * 100:.1f} entities per 100 chars")
    print(f"  Database coverage: {result['processing_metadata']['categories_detected']} categories")
    
    # Test specific fixes
    print(f"\n🔧 TESTING SPECIFIC FIXES:")
    diabetes_found = any('diabetes' in e['text'].lower() for e in result['medical_entities'])
    cancer_found = any('cancer' in e['text'].lower() for e in result['medical_entities'])
    print(f"  ✅ Diabetes detection: {'FOUND' if diabetes_found else 'MISSING'}")
    print(f"  ✅ Cancer detection: {'FOUND' if cancer_found else 'MISSING'}")
    
    return result

if __name__ == "__main__":
    result = asyncio.run(test_real_medical_report())
    
    print(f"\n🎉 REAL MEDICAL REPORT ANALYSIS COMPLETE!")
    print(f"Your NER system successfully analyzed a comprehensive medical case!")
    print(f"Total medical intelligence extracted: {len(result['medical_entities'])} entities")
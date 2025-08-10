"""
Test Enhanced NER System with LOINC Database Integration
"""

import asyncio
import sys
sys.path.append('./backend')
from backend.main import analyze_medical_text_advanced

async def test_enhanced_ner():
    print("🧪 Testing Enhanced NER with LOINC Database")
    print("=" * 60)
    
    # Comprehensive medical text with various lab values
    sample_text = """
    Patient presents with chest pain and shortness of breath. 
    History of hypertension and diabetes mellitus type 2.
    Current medications: lisinopril 10mg daily, metformin 500mg twice daily.
    
    Vital signs: Blood pressure 140/90 mmHg, heart rate 85 bpm, temperature 98.6°F.
    
    Laboratory results:
    - Glucose: 180 mg/dL (elevated)
    - Hemoglobin A1c: 8.2% (elevated)
    - Total cholesterol: 220 mg/dL
    - LDL cholesterol: 140 mg/dL (elevated)
    - HDL cholesterol: 35 mg/dL (low)
    - Triglycerides: 250 mg/dL (elevated)
    - Creatinine: 1.2 mg/dL
    - Blood urea nitrogen: 25 mg/dL
    - Sodium: 138 mEq/L
    - Potassium: 4.2 mEq/L
    - Hemoglobin: 12.5 g/dL
    - Hematocrit: 38%
    - White blood cell count: 7,500/μL
    - Platelet count: 250,000/μL
    - AST: 35 U/L
    - ALT: 40 U/L
    - Troponin I: 0.02 ng/mL (normal)
    - TSH: 2.5 mIU/L
    - Free T4: 1.2 ng/dL
    
    Patient is allergic to penicillin.
    Family history of coronary artery disease.
    """
    
    print("📄 Analyzing comprehensive medical report...")
    result = await analyze_medical_text_advanced(sample_text)
    
    print(f"\n🎯 Analysis Results:")
    print(f"Total entities found: {len(result['medical_entities'])}")
    print(f"Categories detected: {result['processing_metadata']['categories_detected']}")
    print(f"Critical findings: {len(result['critical_findings'])}")
    print(f"Confidence score: {result['confidence_score']}")
    
    print(f"\n📊 Entity Breakdown:")
    for category, count in result['entity_counts'].items():
        if count > 0:
            print(f"  {category}: {count}")
    
    print(f"\n🔍 Sample Entities by Category:")
    for category, entities in result['categorized_entities'].items():
        if entities:
            print(f"  {category.upper()}:")
            for entity in entities[:5]:  # Show first 5
                source = entity.get('source', 'Unknown')
                confidence = entity.get('confidence', 0)
                print(f"    - {entity['text']} ({confidence:.2f}, {source})")
    
    if result['critical_findings']:
        print(f"\n⚠️  Critical Findings:")
        for finding in result['critical_findings']:
            print(f"  - {finding['text']} ({finding['severity']}): {finding['reason']}")
    
    print(f"\n🩺 Differential Diagnosis:")
    for dx in result['differential_diagnosis']:
        print(f"  - {dx['condition']} ({dx['confidence']:.0%}): {dx['reasoning']}")
    
    print(f"\n📈 Performance:")
    print(f"  Processing time: {result.get('processing_time', 'N/A')} seconds")
    print(f"  Text length: {result['processing_metadata']['text_length']} characters")
    print(f"  Entities per 100 chars: {len(result['medical_entities']) / result['processing_metadata']['text_length'] * 100:.1f}")

if __name__ == "__main__":
    asyncio.run(test_enhanced_ner())
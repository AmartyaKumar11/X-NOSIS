import asyncio
import sys
sys.path.append('./backend')
from backend.main import analyze_medical_text_advanced

async def test_analysis():
    sample_text = """
    Patient presents with chest pain and shortness of breath. 
    History of hypertension and diabetes. 
    Currently taking lisinopril 10mg daily and metformin 500mg twice daily.
    Blood pressure 140/90 mmHg, heart rate 85 bpm.
    Glucose level 180 mg/dL, cholesterol 220 mg/dL.
    Patient allergic to penicillin.
    Family history of heart disease.
    Patient underwent chest X-ray and blood test.
    """
    
    result = await analyze_medical_text_advanced(sample_text)
    print('=== ENHANCED MEDICAL NER TEST ===')
    print(f'Total entities found: {len(result["medical_entities"])}')
    print(f'Categories detected: {result["processing_metadata"]["categories_detected"]}')
    print(f'Critical findings: {len(result["critical_findings"])}')
    print(f'Confidence score: {result["confidence_score"]}')
    print()
    print('Entity counts:')
    for category, count in result['entity_counts'].items():
        if count > 0:
            print(f'  {category}: {count}')
    
    if result['critical_findings']:
        print()
        print('Critical findings detected:')
        for finding in result['critical_findings']:
            print(f'  - {finding["text"]} ({finding["severity"]})')
    
    print()
    print('Sample entities by category:')
    for category, entities in result['categorized_entities'].items():
        if entities:
            print(f'  {category}: {[e["text"] for e in entities[:3]]}')

if __name__ == "__main__":
    asyncio.run(test_analysis())
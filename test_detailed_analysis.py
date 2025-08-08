#!/usr/bin/env python3
"""
Detailed test for medical NER system
"""

import requests
import json

def test_detailed_analysis():
    """Test detailed medical analysis with comprehensive output"""
    print("🧪 Testing Enhanced Medical NER System...")
    
    # Complex medical text
    medical_text = """
    Patient is a 65-year-old male presenting with acute chest pain, shortness of breath, 
    and diaphoresis. Past medical history significant for hypertension, diabetes mellitus, 
    and coronary artery disease. Current medications include metformin 1000mg BID, 
    lisinopril 10mg daily, and atorvastatin 40mg nightly. 
    
    Physical examination reveals blood pressure 180/95, heart rate 110 bpm, irregular rhythm. 
    Patient reports severe chest pain radiating to left arm. EKG shows ST elevation in leads II, III, aVF. 
    Troponin levels elevated at 15.2 ng/mL. 
    
    Assessment: Acute ST-elevation myocardial infarction (STEMI). 
    Plan: Emergency cardiac catheterization, aspirin 325mg, clopidogrel loading dose.
    """
    
    # Create test file
    with open('detailed_test.txt', 'w') as f:
        f.write(medical_text)
    
    try:
        with open('detailed_test.txt', 'rb') as f:
            files = {'file': ('detailed_test.txt', f, 'text/plain')}
            response = requests.post('http://localhost:8000/analyze/text', files=files)
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get('results', {})
            
            print("✅ Enhanced Medical Analysis Results:")
            print(f"📊 Analysis ID: {result.get('analysis_id')}")
            print(f"🔍 Overall Confidence: {analysis.get('confidence_score')}")
            print(f"⏱️  Processing Time: {analysis.get('processing_time', 0):.2f}s")
            
            # Entity summary
            entity_summary = analysis.get('entity_summary', {})
            print(f"\n📋 Entity Summary:")
            print(f"   Total Entities: {entity_summary.get('total_entities', 0)}")
            print(f"   Symptoms: {entity_summary.get('symptoms', 0)}")
            print(f"   Conditions: {entity_summary.get('conditions', 0)}")
            print(f"   Medications: {entity_summary.get('medications', 0)}")
            print(f"   Other: {entity_summary.get('other', 0)}")
            
            # Medical entities
            entities = analysis.get('medical_entities', [])
            print(f"\n🏷️  Medical Entities Found:")
            for entity in entities[:10]:  # Show first 10
                print(f"   • {entity.get('text')} ({entity.get('label')}) - {entity.get('confidence')}")
            
            # Differential diagnosis
            differential = analysis.get('differential_diagnosis', [])
            if differential:
                print(f"\n🩺 Differential Diagnosis:")
                for dx in differential:
                    print(f"   • {dx.get('condition')} ({dx.get('confidence')}) - {dx.get('reasoning')}")
            
            # Summary
            summary = analysis.get('summary', '')
            print(f"\n📝 Clinical Summary:")
            print(f"   {summary}")
            
            return True
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_detailed_analysis()
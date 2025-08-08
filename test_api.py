#!/usr/bin/env python3
"""
Test script for DIP API endpoints
"""

import requests

def test_text_analysis():
    """Test medical text analysis endpoint"""
    print("🧪 Testing Bio_ClinicalBERT text analysis...")
    
    # Test text
    medical_text = """
    Patient presents with chest pain, shortness of breath, and elevated blood pressure. 
    History of hypertension and diabetes. Currently taking metformin and lisinopril. 
    Physical examination reveals irregular heartbeat and mild edema in lower extremities.
    """
    
    # Create a text file
    with open('test_medical.txt', 'w') as f:
        f.write(medical_text)
    
    # Test the API
    try:
        with open('test_medical.txt', 'rb') as f:
            files = {'file': ('test_medical.txt', f, 'text/plain')}
            response = requests.post('http://localhost:8000/analyze/text', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text analysis successful!")
            print(f"📊 Analysis ID: {result.get('analysis_id')}")
            print(f"📝 Status: {result.get('status')}")
            print(f"🔍 Confidence: {result.get('results', {}).get('confidence_score', 'N/A')}")
            print(f"📋 Entities found: {len(result.get('results', {}).get('medical_entities', []))}")
            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_text_analysis()
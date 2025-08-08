#!/usr/bin/env python3
"""
Test enhanced medical text analysis API endpoints
"""

import requests
import json

def test_direct_text_analysis():
    """Test direct text analysis endpoint"""
    print("🧪 Testing Direct Text Analysis...")
    
    medical_text = """
    Patient presents with acute myocardial infarction. 
    Symptoms include severe chest pain, diaphoresis, and nausea. 
    Past medical history: hypertension, diabetes. 
    Current medications: metformin, lisinopril.
    """
    
    try:
        response = requests.post(
            'http://localhost:8000/analyze/text-direct',
            json={"text": medical_text}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Direct text analysis successful!")
            print(f"📊 Analysis ID: {result.get('analysis_id')}")
            print(f"🔍 Confidence: {result.get('results', {}).get('confidence_score')}")
            print(f"📋 Entities: {result.get('results', {}).get('entity_summary', {}).get('total_entities')}")
            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

def test_file_validation():
    """Test file validation and error handling"""
    print("\n🧪 Testing File Validation...")
    
    # Test empty file
    try:
        with open('empty_test.txt', 'w') as f:
            pass  # Create empty file
        
        with open('empty_test.txt', 'rb') as f:
            files = {'file': ('empty_test.txt', f, 'text/plain')}
            response = requests.post('http://localhost:8000/analyze/text', files=files)
        
        if response.status_code == 400:
            print("✅ Empty file validation working")
        else:
            print(f"⚠️  Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Validation test failed: {str(e)}")

def test_enhanced_response_format():
    """Test enhanced response format"""
    print("\n🧪 Testing Enhanced Response Format...")
    
    medical_text = "Patient has chest pain and takes aspirin."
    
    with open('format_test.txt', 'w') as f:
        f.write(medical_text)
    
    try:
        with open('format_test.txt', 'rb') as f:
            files = {'file': ('format_test.txt', f, 'text/plain')}
            response = requests.post('http://localhost:8000/analyze/text', files=files)
        
        if response.status_code == 200:
            result = response.json()
            
            # Check enhanced response structure
            required_fields = ['success', 'analysis_id', 'status', 'message', 'results', 'timestamp']
            missing_fields = [field for field in required_fields if field not in result]
            
            if not missing_fields:
                print("✅ Enhanced response format working")
                print(f"📊 File info included: {'file_info' in result.get('results', {})}")
                print(f"⏱️  Processing time: {result.get('results', {}).get('processing_time')}s")
            else:
                print(f"⚠️  Missing fields: {missing_fields}")
                
        else:
            print(f"❌ Request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Format test failed: {str(e)}")

if __name__ == "__main__":
    test_direct_text_analysis()
    test_file_validation()
    test_enhanced_response_format()
    print("\n🎉 API endpoint testing completed!")
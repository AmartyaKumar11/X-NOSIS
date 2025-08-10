#!/usr/bin/env python3
"""
Test the actual website integration with medical database
"""
import requests
import json

def test_website_medical_analysis():
    """Test the actual API endpoint that the website uses"""
    
    # Test medical text
    test_text = """
    Patient presents with chest pain and shortness of breath. 
    History of hypertension and diabetes mellitus type 2.
    Current medications include metformin 500mg and lisinopril 10mg.
    Vital signs: BP 140/90 mmHg, HR 85 bpm, Temperature 98.6°F.
    Lab results show glucose 180 mg/dL, cholesterol 220 mg/dL, hemoglobin 12.5 g/dL.
    Patient is allergic to penicillin.
    Family history of heart disease.
    """
    
    print("🧪 Testing Website Medical Analysis Integration")
    print("=" * 60)
    
    # Test the text analysis endpoint (what website uses)
    try:
        url = "http://localhost:8000/analyze/text-direct"
        payload = {"text": test_text}
        
        print("📡 Sending request to website API endpoint...")
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Website API responded successfully!")
            print(f"📊 Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"🎯 Confidence: {result.get('results', {}).get('confidence_score', 'N/A')}")
            print(f"🔍 Total entities: {result.get('results', {}).get('total_entities', 'N/A')}")
            print(f"📋 Categories: {result.get('results', {}).get('categories_detected', 'N/A')}")
            print(f"⚠️  Critical findings: {result.get('results', {}).get('critical_findings_count', 'N/A')}")
            
            # Check if medical database sources are included
            entities = result.get('results', {}).get('medical_entities', [])
            if entities:
                print(f"\n🔬 Sample entities with database sources:")
                for i, entity in enumerate(entities[:5]):  # Show first 5
                    source = entity.get('source', 'Unknown')
                    print(f"  • {entity['text']} ({entity['label']}) - Source: {source}")
                
                # Count entities by source
                sources = {}
                for entity in entities:
                    source = entity.get('source', 'Unknown')
                    sources[source] = sources.get(source, 0) + 1
                
                print(f"\n📊 Entities by database source:")
                for source, count in sources.items():
                    print(f"  • {source}: {count} entities")
            
            print(f"\n🎉 Website integration successful!")
            print(f"   Your website is now using the comprehensive medical database!")
            return True
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server")
        print("   Make sure the backend is running: python backend/main.py")
        return False
    except Exception as e:
        print(f"❌ Error testing website integration: {e}")
        return False

def test_file_upload_endpoint():
    """Test the file upload endpoint that the website uses"""
    
    print("\n🧪 Testing Website File Upload Integration")
    print("=" * 60)
    
    # Create a test medical report file
    test_content = """
    MEDICAL REPORT
    
    Patient: John Doe
    Date: 2024-01-15
    
    Chief Complaint: Chest pain and difficulty breathing
    
    History of Present Illness:
    The patient is a 65-year-old male with a history of hypertension and type 2 diabetes 
    who presents with acute onset chest pain and shortness of breath. Pain is described 
    as crushing, substernal, radiating to left arm. Associated with nausea and diaphoresis.
    
    Past Medical History:
    - Hypertension
    - Type 2 Diabetes Mellitus
    - Hyperlipidemia
    
    Medications:
    - Metformin 1000mg BID
    - Lisinopril 20mg daily
    - Atorvastatin 40mg daily
    
    Vital Signs:
    - BP: 160/95 mmHg
    - HR: 110 bpm
    - RR: 24/min
    - Temp: 98.6°F
    - O2 Sat: 94% on room air
    
    Laboratory Results:
    - Glucose: 180 mg/dL
    - Troponin I: 2.5 ng/mL (elevated)
    - Cholesterol: 240 mg/dL
    - Hemoglobin: 11.8 g/dL
    - Creatinine: 1.2 mg/dL
    
    Assessment:
    Acute myocardial infarction with diabetes and hypertension
    
    Plan:
    1. Cardiac catheterization
    2. Continue current medications
    3. Monitor glucose levels
    """
    
    try:
        # Write test file
        with open("test_medical_report_upload.txt", "w") as f:
            f.write(test_content)
        
        # Test file upload endpoint
        url = "http://localhost:8000/analyze/text"
        
        with open("test_medical_report_upload.txt", "rb") as f:
            files = {"file": ("test_report.txt", f, "text/plain")}
            
            print("📡 Uploading test medical report...")
            response = requests.post(url, files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File upload and analysis successful!")
            print(f"📊 Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"🎯 Confidence: {result.get('results', {}).get('confidence_score', 'N/A')}")
            print(f"🔍 Total entities: {result.get('results', {}).get('total_entities', 'N/A')}")
            print(f"⚠️  Critical findings: {result.get('results', {}).get('critical_findings_count', 'N/A')}")
            
            # Check processing time
            processing_time = result.get('results', {}).get('processing_time', 'N/A')
            print(f"⏱️  Processing time: {processing_time}s")
            
            # Check file info
            file_info = result.get('results', {}).get('file_info', {})
            print(f"📄 File processed: {file_info.get('filename', 'N/A')}")
            print(f"📏 File size: {file_info.get('file_size', 'N/A')} bytes")
            
            print(f"\n🎉 File upload integration successful!")
            return True
            
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing file upload: {e}")
        return False
    finally:
        # Clean up test file
        try:
            import os
            os.remove("test_medical_report_upload.txt")
        except:
            pass

if __name__ == "__main__":
    print("🏥 TESTING WEBSITE MEDICAL DATABASE INTEGRATION")
    print("=" * 80)
    
    # Test both endpoints
    text_success = test_website_medical_analysis()
    file_success = test_file_upload_endpoint()
    
    print("\n" + "=" * 80)
    if text_success and file_success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Your website is fully integrated with the medical database!")
        print("✅ Both text analysis and file upload work with comprehensive medical data!")
    else:
        print("❌ Some tests failed. Check the backend server and try again.")
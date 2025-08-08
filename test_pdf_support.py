#!/usr/bin/env python3
"""
Test PDF support in the medical analysis API
"""

import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

def create_test_medical_pdf():
    """Create a test medical PDF for testing"""
    buffer = io.BytesIO()
    
    # Create PDF with medical content
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add medical report content
    medical_text = [
        "MEDICAL REPORT",
        "",
        "Patient: John Doe",
        "Date: August 8, 2025",
        "",
        "Chief Complaint:",
        "Patient presents with acute chest pain and shortness of breath.",
        "",
        "History of Present Illness:",
        "65-year-old male with sudden onset of severe chest pain",
        "radiating to left arm. Associated with diaphoresis and nausea.",
        "",
        "Past Medical History:",
        "- Hypertension",
        "- Diabetes mellitus type 2",
        "- Coronary artery disease",
        "",
        "Current Medications:",
        "- Metformin 1000mg BID",
        "- Lisinopril 10mg daily",
        "- Atorvastatin 40mg nightly",
        "",
        "Physical Examination:",
        "Blood pressure: 180/95 mmHg",
        "Heart rate: 110 bpm, irregular",
        "Respiratory rate: 22/min",
        "",
        "Assessment:",
        "Acute ST-elevation myocardial infarction (STEMI)",
        "",
        "Plan:",
        "1. Emergency cardiac catheterization",
        "2. Aspirin 325mg stat",
        "3. Clopidogrel loading dose"
    ]
    
    y_position = 750
    for line in medical_text:
        p.drawString(50, y_position, line)
        y_position -= 20
    
    p.save()
    buffer.seek(0)
    return buffer.getvalue()

def test_pdf_analysis():
    """Test PDF analysis via API"""
    print("🧪 Testing PDF Medical Report Analysis...")
    
    try:
        # Create test PDF
        pdf_content = create_test_medical_pdf()
        
        # Save to file for testing
        with open('test_medical_report.pdf', 'wb') as f:
            f.write(pdf_content)
        
        print("✅ Test PDF created: test_medical_report.pdf")
        
        # Test API with PDF
        with open('test_medical_report.pdf', 'rb') as f:
            files = {'file': ('test_medical_report.pdf', f, 'application/pdf')}
            response = requests.post('http://localhost:8000/analyze/text', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF analysis successful!")
            print(f"📊 Analysis ID: {result.get('analysis_id')}")
            
            results = result.get('results', {})
            print(f"🔍 Confidence: {results.get('confidence_score', 0):.2f}")
            print(f"📋 Total Entities: {results.get('entity_summary', {}).get('total_entities', 0)}")
            print(f"⏱️  Processing Time: {results.get('processing_time', 0):.2f}s")
            
            # Show some entities
            entities = results.get('medical_entities', [])[:5]
            if entities:
                print("\n🏷️  Sample Entities Found:")
                for entity in entities:
                    print(f"   • {entity.get('text')} ({entity.get('label')}) - {entity.get('confidence'):.2f}")
            
            # Show differential diagnosis
            dx_list = results.get('differential_diagnosis', [])[:3]
            if dx_list:
                print("\n🩺 Differential Diagnosis:")
                for dx in dx_list:
                    print(f"   • {dx.get('condition')} ({dx.get('confidence'):.2f}) - {dx.get('reasoning')}")
            
            return True
            
        else:
            print(f"❌ PDF analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Check if reportlab is available
    try:
        import reportlab
        test_pdf_analysis()
    except ImportError:
        print("⚠️  reportlab not installed. Installing...")
        import subprocess
        subprocess.run(["pip", "install", "reportlab"])
        test_pdf_analysis()
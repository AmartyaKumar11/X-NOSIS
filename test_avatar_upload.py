#!/usr/bin/env python3
"""
Test script for patient avatar upload functionality
"""

import requests
import json

def test_avatar_upload():
    base_url = "http://localhost:8000"
    
    # First, create a test patient
    patient_data = {
        "name": "Test Patient Avatar",
        "date_of_birth": "1990-01-01",
        "metadata": {
            "phone": "555-0123",
            "email": "test@example.com"
        }
    }
    
    print("🧪 Creating test patient...")
    response = requests.post(f"{base_url}/patients", json=patient_data)
    
    if response.status_code == 200:
        result = response.json()
        patient_id = result["patient_id"]
        print(f"✅ Patient created with ID: {patient_id}")
        
        # Test avatar upload (using a small test image)
        # For this test, we'll create a minimal PNG file
        test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        
        print("📸 Testing avatar upload...")
        files = {'avatar': ('test_avatar.png', test_image_data, 'image/png')}
        
        avatar_response = requests.post(f"{base_url}/patients/{patient_id}/avatar", files=files)
        
        if avatar_response.status_code == 200:
            avatar_result = avatar_response.json()
            print(f"✅ Avatar uploaded successfully: {avatar_result['avatar_url']}")
            
            # Verify patient data includes avatar
            print("🔍 Verifying patient data includes avatar...")
            patient_response = requests.get(f"{base_url}/patients/{patient_id}")
            
            if patient_response.status_code == 200:
                patient_data = patient_response.json()
                if patient_data["patient"]["metadata"].get("avatar_url"):
                    print(f"✅ Avatar URL found in patient metadata: {patient_data['patient']['metadata']['avatar_url']}")
                    print("🎉 Avatar upload test completed successfully!")
                else:
                    print("❌ Avatar URL not found in patient metadata")
            else:
                print(f"❌ Failed to fetch patient data: {patient_response.status_code}")
        else:
            print(f"❌ Avatar upload failed: {avatar_response.status_code}")
            print(f"Error: {avatar_response.text}")
    else:
        print(f"❌ Failed to create patient: {response.status_code}")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("🚀 Starting avatar upload test...")
    test_avatar_upload()
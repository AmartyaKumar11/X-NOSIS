#!/usr/bin/env python3

import requests
import json

def test_patient_creation():
    """Test patient creation API endpoint"""
    
    # Test data
    patient_data = {
        "name": "John Doe",
        "date_of_birth": "1985-06-15",
        "metadata": {
            "phone": "+1-555-0123",
            "email": "john.doe@example.com",
            "gender": "Male"
        }
    }
    
    try:
        # Test patient creation
        print("Testing patient creation...")
        response = requests.post(
            "http://localhost:8000/patients",
            json=patient_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Patient created successfully!")
            print(f"   Patient ID: {result['patient_id']}")
            print(f"   Message: {result['message']}")
            
            # Test fetching all patients
            print("\nTesting patient retrieval...")
            get_response = requests.get("http://localhost:8000/patients")
            
            if get_response.status_code == 200:
                patients = get_response.json()
                print(f"✅ Retrieved {len(patients['patients'])} patients")
                for patient in patients['patients']:
                    print(f"   - {patient['name']} (ID: {patient['id']})")
            else:
                print(f"❌ Failed to retrieve patients: {get_response.status_code}")
                
        else:
            print(f"❌ Failed to create patient: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server.")
        print("   Make sure the backend is running: python backend/main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_patient_creation()
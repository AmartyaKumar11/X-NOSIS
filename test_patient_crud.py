#!/usr/bin/env python3

import requests
import json

def test_patient_crud():
    """Test patient CRUD operations"""
    
    base_url = "http://localhost:8000"
    
    # First create a patient
    patient_data = {
        "name": "Jane Smith",
        "date_of_birth": "1990-03-20",
        "metadata": {
            "phone": "+1-555-0456",
            "email": "jane.smith@example.com",
            "gender": "Female"
        }
    }
    
    try:
        print("1. Creating patient...")
        response = requests.post(f"{base_url}/patients", json=patient_data)
        
        if response.status_code == 200:
            result = response.json()
            patient_id = result['patient_id']
            print(f"✅ Patient created: {patient_id}")
            
            # Test updating patient
            print("\n2. Testing patient update...")
            update_data = {
                "name": "Jane Smith-Johnson",
                "date_of_birth": "1990-03-20",
                "metadata": {
                    "phone": "+1-555-0456",
                    "email": "jane.johnson@example.com",
                    "gender": "Female",
                    "blood_type": "O+",
                    "allergies": "Penicillin",
                    "emergency_contact": "John Johnson - +1-555-0789"
                }
            }
            
            update_response = requests.put(f"{base_url}/patients/{patient_id}", json=update_data)
            
            if update_response.status_code == 200:
                print("✅ Patient updated successfully")
                
                # Verify the update
                get_response = requests.get(f"{base_url}/patients/{patient_id}")
                if get_response.status_code == 200:
                    patient = get_response.json()['patient']
                    print(f"   Updated name: {patient['name']}")
                    print(f"   Updated email: {patient['metadata'].get('email')}")
                    print(f"   Blood type: {patient['metadata'].get('blood_type')}")
                    print(f"   Allergies: {patient['metadata'].get('allergies')}")
                
            else:
                print(f"❌ Failed to update patient: {update_response.status_code}")
            
            # Test deleting patient
            print("\n3. Testing patient deletion...")
            delete_response = requests.delete(f"{base_url}/patients/{patient_id}")
            
            if delete_response.status_code == 200:
                print("✅ Patient deleted successfully")
                
                # Verify deletion
                verify_response = requests.get(f"{base_url}/patients/{patient_id}")
                if verify_response.status_code == 404:
                    print("✅ Patient deletion verified")
                else:
                    print("❌ Patient still exists after deletion")
            else:
                print(f"❌ Failed to delete patient: {delete_response.status_code}")
                
        else:
            print(f"❌ Failed to create patient: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server.")
        print("   Make sure the backend is running: python backend/main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_patient_crud()
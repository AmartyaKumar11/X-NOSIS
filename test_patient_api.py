#!/usr/bin/env python3
"""
Test patient management API endpoints
"""

import requests
import json

def test_patient_management():
    """Test patient management API endpoints"""
    print("Testing Patient Management API...")
    
    base_url = "http://localhost:8000"
    
    # Test 1: Create a new patient
    print("\n1. Creating a new patient...")
    patient_data = {
        "name": "John Doe",
        "date_of_birth": "1980-05-15",
        "metadata": {
            "phone": "555-0123",
            "email": "john.doe@example.com"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/patients", json=patient_data)
        if response.status_code == 200:
            result = response.json()
            patient_id = result.get('patient_id')
            print(f"✅ Patient created successfully: {patient_id}")
        else:
            print(f"❌ Failed to create patient: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Error creating patient: {str(e)}")
        return False
    
    # Test 2: Get all patients
    print("\n2. Fetching all patients...")
    try:
        response = requests.get(f"{base_url}/patients")
        if response.status_code == 200:
            result = response.json()
            patients = result.get('patients', [])
            print(f"✅ Found {len(patients)} patients")
            for patient in patients:
                print(f"   • {patient['name']} - {patient['document_count']} documents")
        else:
            print(f"❌ Failed to fetch patients: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching patients: {str(e)}")
    
    # Test 3: Get specific patient with directories
    print(f"\n3. Fetching patient details for {patient_id}...")
    try:
        response = requests.get(f"{base_url}/patients/{patient_id}")
        if response.status_code == 200:
            result = response.json()
            patient = result.get('patient', {})
            directories = patient.get('directories', [])
            print(f"✅ Patient details retrieved")
            print(f"   Name: {patient['name']}")
            print(f"   Default directories created: {len(directories)}")
            for directory in directories:
                print(f"   • {directory['name']} ({directory['type']}) - {directory['document_count']} docs")
        else:
            print(f"❌ Failed to fetch patient details: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching patient details: {str(e)}")
    
    # Test 4: Create custom directory
    print(f"\n4. Creating custom directory for patient...")
    custom_dir_data = {
        "name": "Cardiology Reports",
        "type": "custom",
        "icon": "Heart",
        "color": "red"
    }
    
    try:
        response = requests.post(f"{base_url}/patients/{patient_id}/directories", json=custom_dir_data)
        if response.status_code == 200:
            result = response.json()
            directory_id = result.get('directory_id')
            print(f"✅ Custom directory created: {directory_id}")
        else:
            print(f"❌ Failed to create directory: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error creating directory: {str(e)}")
    
    print("\n🎉 Patient Management API testing completed!")
    return True

if __name__ == "__main__":
    test_patient_management()
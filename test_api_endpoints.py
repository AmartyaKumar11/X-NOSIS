#!/usr/bin/env python3
"""
Test available API endpoints
"""
import requests

def test_available_endpoints():
    """Test what endpoints are available"""
    
    print("🔍 Testing Available API Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"GET /: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"GET /: Error - {e}")
    
    # Test docs endpoint
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"GET /docs: {response.status_code}")
    except Exception as e:
        print(f"GET /docs: Error - {e}")
    
    # Test common endpoints
    endpoints_to_test = [
        "/analyze-file",
        "/analyze-text", 
        "/analyze",
        "/health",
        "/status"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"GET {endpoint}: {response.status_code}")
            if response.status_code != 404:
                print(f"   Available!")
        except Exception as e:
            print(f"GET {endpoint}: Error - {e}")

if __name__ == "__main__":
    test_available_endpoints()
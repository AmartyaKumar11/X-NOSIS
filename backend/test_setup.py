#!/usr/bin/env python3
"""
Test script to verify DIP backend setup
"""

import requests
import json

def test_backend():
    """Test basic backend functionality"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing X-NOSIS DIP Backend Setup...")
    
    try:
        # Test health endpoint
        print("\n1. Testing health check...")
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print("❌ Health check failed")
            return False
        
        # Test root endpoint
        print("\n2. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print("❌ Root endpoint failed")
            return False
        
        print("\n🎉 Backend setup test completed successfully!")
        print("\nNext steps:")
        print("1. Install requirements: pip install -r requirements.txt")
        print("2. Start server: uvicorn main:app --reload --port 8000")
        print("3. Test endpoints at http://localhost:8000/docs")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure the server is running: uvicorn main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    test_backend()
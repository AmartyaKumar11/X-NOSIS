#!/usr/bin/env python3
"""
Test simple website integration
"""
import requests
import json

def test_simple_text_analysis():
    """Test with a simple medical text"""
    
    print("🧪 Testing Simple Medical Text Analysis")
    print("=" * 50)
    
    # Simple test text
    test_text = "Patient has chest pain and takes aspirin."
    
    try:
        url = "http://localhost:8000/analyze/text-direct"
        payload = {"text": test_text}
        
        print("📡 Sending simple request...")
        print(f"📝 Text: {test_text}")
        
        # Increase timeout to 60 seconds for database loading
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Simple analysis successful!")
            print(f"📊 Analysis ID: {result.get('analysis_id', 'N/A')}")
            
            # Check if we got results
            results = result.get('results', {})
            if results:
                print(f"🎯 Confidence: {results.get('confidence_score', 'N/A')}")
                print(f"🔍 Total entities: {results.get('total_entities', 'N/A')}")
                
                # Show some entities
                entities = results.get('medical_entities', [])
                if entities:
                    print(f"\n🔬 Found {len(entities)} medical entities:")
                    for entity in entities[:3]:  # Show first 3
                        source = entity.get('source', 'Unknown')
                        print(f"  • {entity['text']} ({entity['label']}) - {source}")
                
                print(f"\n🎉 Medical database integration working!")
                return True
            else:
                print("❌ No results returned")
                return False
                
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out - database might still be loading")
        print("   This is normal on first run as LOINC database loads")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_health_endpoint():
    """Test the health endpoint"""
    
    print("\n🏥 Testing Health Endpoint")
    print("=" * 30)
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=10)
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check passed!")
            print(f"📊 Status: {result.get('status', 'N/A')}")
            print(f"🔬 Medical DB: {result.get('medical_database_status', 'N/A')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    print("🏥 SIMPLE WEBSITE INTEGRATION TEST")
    print("=" * 60)
    
    # Test health first
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Test simple analysis
        analysis_ok = test_simple_text_analysis()
        
        if analysis_ok:
            print("\n🎉 WEBSITE INTEGRATION SUCCESSFUL!")
            print("✅ Your website is connected to the medical database!")
        else:
            print("\n⏰ Analysis timed out - try again in a moment")
            print("   The medical database is loading in the background")
    else:
        print("\n❌ Server health check failed")
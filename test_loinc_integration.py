"""
Test LOINC Database Integration
"""

import sys
sys.path.append('./backend')

from medical_databases import MedicalDatabaseManager
import time

def test_loinc_integration():
    print("🧪 Testing LOINC Database Integration")
    print("=" * 50)
    
    # Initialize database manager
    print("🔄 Initializing database manager...")
    db_manager = MedicalDatabaseManager()
    
    # Load LOINC codes
    print("🔄 Loading LOINC codes from file...")
    start_time = time.time()
    
    loinc_count = db_manager.load_loinc_codes()
    
    load_time = time.time() - start_time
    
    if loinc_count > 0:
        print(f"✅ Successfully loaded {loinc_count:,} LOINC codes in {load_time:.2f} seconds!")
    else:
        print("❌ Failed to load LOINC codes")
        return False
    
    # Test search functionality
    print("\n🔍 Testing search functionality:")
    test_searches = [
        ("glucose", "LAB_VALUES"),
        ("cholesterol", "LAB_VALUES"), 
        ("hemoglobin", "LAB_VALUES"),
        ("blood pressure", "VITAL_SIGNS"),
        ("heart rate", "VITAL_SIGNS"),
        ("creatinine", "LAB_VALUES"),
        ("thyroid", "LAB_VALUES")
    ]
    
    for search_term, category in test_searches:
        results = db_manager.search_medical_terms(f"patient has {search_term}", category)
        if results:
            print(f"  ✅ '{search_term}': Found {len(results)} matches")
            # Show first few results
            for i, (term, cat, source) in enumerate(results[:3]):
                print(f"    - {term} ({cat}, {source})")
        else:
            print(f"  ❌ '{search_term}': No matches found")
    
    # Get database statistics
    print("\n📊 Database Statistics:")
    stats = db_manager.get_database_stats()
    for db_name, count in stats.items():
        print(f"  {db_name}: {count:,} terms")
    
    total_terms = sum(stats.values())
    print(f"\n🎉 Total medical terms available: {total_terms:,}")
    
    return True

if __name__ == "__main__":
    success = test_loinc_integration()
    
    if success:
        print("\n🚀 LOINC integration successful!")
        print("Your NER system now has access to comprehensive lab codes!")
    else:
        print("\n❌ LOINC integration failed")
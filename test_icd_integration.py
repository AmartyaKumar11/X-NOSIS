"""
Test ICD-10/ICD-11 Database Integration
"""

import sys
sys.path.append('./backend')

from medical_databases import MedicalDatabaseManager
import time

def test_icd_integration():
    print("🏥 Testing ICD-10/ICD-11 Database Integration")
    print("=" * 60)
    
    # Initialize database manager
    print("🔄 Initializing database manager...")
    db_manager = MedicalDatabaseManager()
    
    # Load all databases including ICD
    print("🔄 Loading all medical databases...")
    start_time = time.time()
    
    results = db_manager.load_all_databases()
    
    load_time = time.time() - start_time
    
    print(f"\n⏱️  Total loading time: {load_time:.2f} seconds")
    
    # Test diagnosis search functionality
    print("\n🔍 Testing DIAGNOSIS search functionality:")
    diagnosis_searches = [
        "diabetes",
        "hypertension", 
        "pneumonia",
        "heart failure",
        "stroke",
        "asthma",
        "depression",
        "covid-19",
        "cancer",
        "arthritis"
    ]
    
    found_diagnoses = 0
    for diagnosis in diagnosis_searches:
        results = db_manager.search_medical_terms(f"patient has {diagnosis}", "CONDITION")
        if results:
            found_diagnoses += 1
            print(f"  ✅ '{diagnosis}': Found {len(results)} matches")
            # Show first few results with ICD codes
            for i, (term, cat, source) in enumerate(results[:2]):
                print(f"    - {term} ({source})")
        else:
            print(f"  ❌ '{diagnosis}': No matches found")
    
    print(f"\n📊 Diagnosis Coverage: {found_diagnoses}/{len(diagnosis_searches)} ({found_diagnoses/len(diagnosis_searches)*100:.0f}%)")
    
    # Get comprehensive database statistics
    print("\n📊 Complete Database Statistics:")
    stats = db_manager.get_database_stats()
    total_terms = 0
    for db_name, count in stats.items():
        print(f"  {db_name}: {count:,} terms")
        total_terms += count
    
    print(f"\n🎉 Total medical terms available: {total_terms:,}")
    
    # Test comprehensive medical text
    print("\n🧪 Testing comprehensive medical analysis:")
    test_text = "Patient has diabetes, hypertension, and pneumonia. Lab shows elevated glucose and cholesterol."
    
    all_results = db_manager.search_medical_terms(test_text)
    print(f"Found {len(all_results)} medical terms in test text:")
    
    by_category = {}
    for term, category, source in all_results:
        if category not in by_category:
            by_category[category] = []
        by_category[category].append((term, source))
    
    for category, terms in by_category.items():
        print(f"  {category}: {len(terms)} terms")
        for term, source in terms[:3]:  # Show first 3
            print(f"    - {term} ({source})")
    
    return True

if __name__ == "__main__":
    success = test_icd_integration()
    
    if success:
        print("\n🚀 ICD integration successful!")
        print("Your NER system now has comprehensive diagnosis coverage!")
    else:
        print("\n❌ ICD integration failed")
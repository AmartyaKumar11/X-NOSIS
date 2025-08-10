"""
Check what's actually in our LOINC database
"""

import sys
sys.path.append('./backend')
from medical_databases import MedicalDatabaseManager

def check_loinc_content():
    print("🔍 Checking LOINC Database Content")
    print("=" * 50)
    
    db_manager = MedicalDatabaseManager()
    
    # Search for common diagnoses
    print("🩺 Searching for DIAGNOSES in LOINC:")
    diagnoses = ["diabetes", "hypertension", "pneumonia", "cancer", "heart failure", "stroke", "asthma"]
    
    for diagnosis in diagnoses:
        results = db_manager.search_medical_terms(f"patient has {diagnosis}")
        if results:
            print(f"  ✅ '{diagnosis}': Found {len(results)} matches")
            for term, category, source in results[:3]:
                print(f"    - {term} ({category}, {source})")
        else:
            print(f"  ❌ '{diagnosis}': NOT FOUND")
    
    print("\n🧪 Searching for LAB VALUES in LOINC:")
    lab_values = ["glucose", "cholesterol", "hemoglobin", "creatinine", "sodium", "potassium"]
    
    for lab in lab_values:
        results = db_manager.search_medical_terms(f"patient has {lab}")
        if results:
            print(f"  ✅ '{lab}': Found {len(results)} matches")
        else:
            print(f"  ❌ '{lab}': NOT FOUND")
    
    print("\n📊 Database Statistics:")
    stats = db_manager.get_database_stats()
    for db_name, count in stats.items():
        print(f"  {db_name}: {count:,} terms")

if __name__ == "__main__":
    check_loinc_content()
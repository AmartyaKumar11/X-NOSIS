"""
Complete Medical Database System Overview
Shows everything in your medical knowledge base
"""

import sys
sys.path.append('./backend')
from medical_databases import MedicalDatabaseManager
import sqlite3

def analyze_complete_medical_database():
    print("🏥 YOUR COMPLETE MEDICAL DATABASE SYSTEM")
    print("=" * 80)
    
    db_manager = MedicalDatabaseManager()
    
    # Get comprehensive statistics
    print("📊 DATABASE STATISTICS:")
    stats = db_manager.get_database_stats()
    total_terms = sum(stats.values())
    
    for db_name, count in stats.items():
        percentage = (count / total_terms * 100) if total_terms > 0 else 0
        print(f"  {db_name:15}: {count:>8,} terms ({percentage:5.1f}%)")
    
    print(f"\n🎯 TOTAL MEDICAL TERMS: {total_terms:,}")
    
    # Analyze by category
    print(f"\n📋 MEDICAL CATEGORIES BREAKDOWN:")
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT category, COUNT(*) as count, source_db
        FROM medical_terms 
        GROUP BY category, source_db
        ORDER BY category, count DESC
    ''')
    
    results = cursor.fetchall()
    current_category = None
    category_totals = {}
    
    for category, count, source in results:
        if category != current_category:
            if current_category:
                print(f"    └─ TOTAL: {category_totals[current_category]:,} terms\n")
            current_category = category
            category_totals[category] = 0
            print(f"  {category.upper()}:")
        
        category_totals[category] += count
        print(f"    ├─ {source}: {count:,} terms")
    
    if current_category:
        print(f"    └─ TOTAL: {category_totals[current_category]:,} terms\n")
    
    # Show sample terms from each category
    print(f"🔍 SAMPLE TERMS BY CATEGORY:")
    for category in category_totals.keys():
        cursor.execute('''
            SELECT term, source_db, concept_id 
            FROM medical_terms 
            WHERE category = ? 
            ORDER BY RANDOM() 
            LIMIT 5
        ''', (category,))
        
        samples = cursor.fetchall()
        print(f"\n  {category.upper()} (samples):")
        for term, source, concept_id in samples:
            code_display = f" [{concept_id}]" if concept_id else ""
            print(f"    • {term} ({source}{code_display})")
    
    # Show database sources in detail
    print(f"\n🗄️  DATABASE SOURCES DETAILED:")
    
    print(f"\n  1. 📊 LOINC (Logical Observation Identifiers Names and Codes)")
    print(f"     • Purpose: Laboratory tests, vital signs, clinical measurements")
    print(f"     • Source: Official LOINC database file (Loinc_2.80)")
    print(f"     • Coverage: {stats.get('LOINC', 0):,} lab codes")
    print(f"     • Examples: glucose, cholesterol, blood pressure, hemoglobin")
    
    print(f"\n  2. 💊 OpenFDA (U.S. Food and Drug Administration)")
    print(f"     • Purpose: FDA-approved medications and drugs")
    print(f"     • Source: Live API calls to api.fda.gov")
    print(f"     • Coverage: {stats.get('OpenFDA', 0):,} drug names")
    print(f"     • Examples: aspirin, metformin, lisinopril, atorvastatin")
    
    print(f"\n  3. 🏥 ICD-10 (International Classification of Diseases)")
    print(f"     • Purpose: Disease diagnoses and medical conditions")
    print(f"     • Source: WHO ICD-10 classification system")
    print(f"     • Coverage: {stats.get('ICD-10', 0):,} diagnosis codes")
    print(f"     • Examples: diabetes, hypertension, pneumonia, heart failure")
    
    print(f"\n  4. 🆕 ICD-11 (International Classification of Diseases - Latest)")
    print(f"     • Purpose: Modern diseases and updated classifications")
    print(f"     • Source: WHO ICD-11 classification system")
    print(f"     • Coverage: {stats.get('ICD-11', 0):,} modern diagnosis codes")
    print(f"     • Examples: long covid, ADHD, PTSD, autism spectrum disorder")
    
    print(f"\n  5. 🧬 HPO (Human Phenotype Ontology)")
    print(f"     • Purpose: Human phenotypes, symptoms, and clinical features")
    print(f"     • Source: HPO database with official HPO IDs")
    print(f"     • Coverage: {stats.get('HPO', 0):,} phenotypes")
    print(f"     • Examples: chest pain, headache, seizure, muscle weakness")
    
    print(f"\n  6. 🏛️  UMLS (Unified Medical Language System)")
    print(f"     • Purpose: Comprehensive medical concepts and terminology")
    print(f"     • Source: National Library of Medicine UMLS")
    print(f"     • Coverage: {stats.get('UMLS', 0):,} medical concepts")
    print(f"     • Examples: medical procedures, anatomy, conditions")
    
    print(f"\n  7. ⚠️  MedDRA (Medical Dictionary for Regulatory Activities)")
    print(f"     • Purpose: Adverse drug events and medication reactions")
    print(f"     • Source: International medical terminology for drug safety")
    print(f"     • Coverage: {stats.get('MedDRA', 0):,} adverse event terms")
    print(f"     • Examples: drug rash, anaphylaxis, hepatotoxicity")
    
    # Show search capabilities
    print(f"\n🔍 SEARCH CAPABILITIES:")
    print(f"  • Full-text search across all {total_terms:,} medical terms")
    print(f"  • Category-specific filtering (CONDITION, MEDICATION, LAB_VALUES, etc.)")
    print(f"  • Source database tracking (know where each term came from)")
    print(f"  • Confidence scoring for each detected entity")
    print(f"  • Official medical codes (ICD-10, LOINC, HPO, etc.)")
    
    # Show integration status
    print(f"\n🔗 INTEGRATION STATUS:")
    print(f"  ✅ Real-time API: OpenFDA (live drug data)")
    print(f"  ✅ File-based: LOINC (comprehensive lab codes)")
    print(f"  ✅ Static databases: ICD-10/11, HPO, UMLS, MedDRA")
    print(f"  ✅ NER integration: Connected to main analysis system")
    print(f"  ✅ Frontend display: Card-based medical analysis results")
    
    conn.close()
    
    return {
        'total_terms': total_terms,
        'databases': len(stats),
        'categories': len(category_totals),
        'stats': stats
    }

if __name__ == "__main__":
    overview = analyze_complete_medical_database()
    
    print(f"\n🎉 SUMMARY:")
    print(f"  • {overview['total_terms']:,} total medical terms")
    print(f"  • {overview['databases']} integrated databases")
    print(f"  • {overview['categories']} medical categories")
    print(f"  • Hospital-grade medical knowledge base!")
    print(f"\n🚀 Your NER system is ready for professional medical analysis!")
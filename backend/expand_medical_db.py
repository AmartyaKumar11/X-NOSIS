#!/usr/bin/env python3
"""
Medical Database Expansion System
Adds comprehensive medical knowledge from multiple sources
"""
import sqlite3
import requests
import json
import csv
import os
import time
from typing import List, Dict, Any, Tuple
import xml.etree.ElementTree as ET

class MedicalDatabaseExpander:
    def __init__(self, db_path: str = "fast_medical.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self.conn.execute("PRAGMA cache_size=20000")
    
    def expand_database(self):
        """Expand the medical database with comprehensive sources"""
        print("🚀 EXPANDING MEDICAL DATABASE")
        print("=" * 60)
        
        initial_count = self._get_term_count()
        print(f"📊 Starting with {initial_count:,} terms")
        
        expansions = [
            ("🔬 Full LOINC Database", self._expand_loinc_full),
            ("💊 Enhanced OpenFDA", self._expand_openfda_full),
            ("🏥 ICD-10 Complete", self._expand_icd10_complete),
            ("🧬 HPO Phenotypes", self._expand_hpo_phenotypes),
            ("🩺 SNOMED CT Sample", self._expand_snomed_sample),
            ("💉 RxNorm Medications", self._expand_rxnorm_sample),
            ("🔬 Medical Abbreviations", self._expand_medical_abbreviations),
            ("🏥 Common Medical Terms", self._expand_common_medical_terms),
            ("🧪 Lab Reference Values", self._expand_lab_reference_values),
            ("⚕️ Medical Specialties", self._expand_medical_specialties)
        ]
        
        for name, expansion_func in expansions:
            print(f"\n{name}")
            print("-" * 40)
            try:
                added = expansion_func()
                print(f"✅ Added {added:,} terms")
            except Exception as e:
                print(f"❌ Error: {e}")
        
        final_count = self._get_term_count()
        added_total = final_count - initial_count
        
        print(f"\n🎉 DATABASE EXPANSION COMPLETE!")
        print(f"📊 Total terms: {final_count:,} (+{added_total:,})")
        print(f"💾 Database size: {os.path.getsize(self.db_path) / 1024 / 1024:.1f} MB")
    
    def _get_term_count(self) -> int:
        """Get current term count"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM medical_terms")
        return cursor.fetchone()[0]
    
    def _expand_loinc_full(self) -> int:
        """Load complete LOINC database"""
        loinc_file = "Loinc_2.80/LoincTable/Loinc.csv"
        if not os.path.exists(loinc_file):
            print("⚠️  LOINC file not found")
            return 0
        
        count = 0
        batch = []
        batch_size = 1000
        
        # Clear existing LOINC terms
        self.conn.execute("DELETE FROM medical_terms WHERE source_db = 'LOINC'")
        
        with open(loinc_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                component = row.get('COMPONENT', '').strip()
                long_name = row.get('LONG_COMMON_NAME', '').strip()
                
                # Add component
                if component and len(component) > 2:
                    category = self._categorize_loinc_term(component)
                    batch.append((
                        component,
                        category,
                        'LOINC',
                        row.get('LOINC_NUM', ''),
                        0.95,
                        component.lower()
                    ))
                    count += 1
                
                # Add long name if different
                if long_name and long_name != component and len(long_name) > 2:
                    category = self._categorize_loinc_term(long_name)
                    batch.append((
                        long_name,
                        category,
                        'LOINC',
                        row.get('LOINC_NUM', ''),
                        0.93,
                        long_name.lower()
                    ))
                    count += 1
                
                if len(batch) >= batch_size:
                    self._insert_batch(batch)
                    batch = []
                    print(f"  Processed {count:,} terms...", end='\r')
        
        if batch:
            self._insert_batch(batch)
        
        return count
    
    def _expand_openfda_full(self) -> int:
        """Load comprehensive OpenFDA drug database"""
        print("  Fetching FDA drug database...")
        
        # Clear existing OpenFDA terms
        self.conn.execute("DELETE FROM medical_terms WHERE source_db = 'OpenFDA'")
        
        count = 0
        batch = []
        
        # Get more comprehensive drug data
        for skip in range(0, 10000, 100):  # Get 10,000 drugs
            try:
                url = f"https://api.fda.gov/drug/label.json?limit=100&skip={skip}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])
                    
                    for result in results:
                        # Extract drug names from various fields
                        drug_names = set()
                        
                        # Brand names
                        brand_names = result.get('openfda', {}).get('brand_name', [])
                        drug_names.update(brand_names)
                        
                        # Generic names
                        generic_names = result.get('openfda', {}).get('generic_name', [])
                        drug_names.update(generic_names)
                        
                        # Substance names
                        substance_names = result.get('openfda', {}).get('substance_name', [])
                        drug_names.update(substance_names)
                        
                        for drug_name in drug_names:
                            if drug_name and len(drug_name.strip()) > 1:
                                clean_name = drug_name.strip().lower()
                                batch.append((
                                    clean_name,
                                    'MEDICATION',
                                    'OpenFDA',
                                    '',
                                    0.92,
                                    clean_name
                                ))
                                count += 1
                    
                    print(f"  Loaded {count:,} drugs...", end='\r')
                    
                    if len(batch) >= 1000:
                        self._insert_batch(batch)
                        batch = []
                
                time.sleep(0.1)  # Rate limiting
                
            except Exception as e:
                print(f"  Error at skip {skip}: {e}")
                break
        
        if batch:
            self._insert_batch(batch)
        
        return count
    
    def _expand_icd10_complete(self) -> int:
        """Add comprehensive ICD-10 codes"""
        icd10_terms = [
            # Infectious diseases
            ("tuberculosis", "CONDITION", "A15"),
            ("pneumonia", "CONDITION", "J18"),
            ("influenza", "CONDITION", "J11"),
            ("covid-19", "CONDITION", "U07.1"),
            ("sepsis", "CONDITION", "A41"),
            ("meningitis", "CONDITION", "G03"),
            ("hepatitis", "CONDITION", "K75"),
            
            # Cardiovascular
            ("myocardial infarction", "CONDITION", "I21"),
            ("heart failure", "CONDITION", "I50"),
            ("atrial fibrillation", "CONDITION", "I48"),
            ("stroke", "CONDITION", "I64"),
            ("hypertension", "CONDITION", "I10"),
            ("angina", "CONDITION", "I20"),
            ("cardiomyopathy", "CONDITION", "I42"),
            
            # Respiratory
            ("asthma", "CONDITION", "J45"),
            ("copd", "CONDITION", "J44"),
            ("pulmonary embolism", "CONDITION", "I26"),
            ("pneumothorax", "CONDITION", "J93"),
            ("bronchitis", "CONDITION", "J40"),
            
            # Endocrine
            ("diabetes mellitus", "CONDITION", "E11"),
            ("hypothyroidism", "CONDITION", "E03"),
            ("hyperthyroidism", "CONDITION", "E05"),
            ("diabetes type 1", "CONDITION", "E10"),
            ("diabetes type 2", "CONDITION", "E11"),
            
            # Neurological
            ("epilepsy", "CONDITION", "G40"),
            ("migraine", "CONDITION", "G43"),
            ("parkinson disease", "CONDITION", "G20"),
            ("alzheimer disease", "CONDITION", "G30"),
            ("multiple sclerosis", "CONDITION", "G35"),
            
            # Mental health
            ("depression", "CONDITION", "F32"),
            ("anxiety", "CONDITION", "F41"),
            ("bipolar disorder", "CONDITION", "F31"),
            ("schizophrenia", "CONDITION", "F20"),
            ("ptsd", "CONDITION", "F43.1"),
            
            # Gastrointestinal
            ("gastritis", "CONDITION", "K29"),
            ("peptic ulcer", "CONDITION", "K27"),
            ("crohn disease", "CONDITION", "K50"),
            ("ulcerative colitis", "CONDITION", "K51"),
            ("cirrhosis", "CONDITION", "K74"),
            
            # Musculoskeletal
            ("osteoarthritis", "CONDITION", "M19"),
            ("rheumatoid arthritis", "CONDITION", "M06"),
            ("osteoporosis", "CONDITION", "M81"),
            ("fibromyalgia", "CONDITION", "M79.3"),
            
            # Cancer
            ("lung cancer", "CONDITION", "C78.0"),
            ("breast cancer", "CONDITION", "C50"),
            ("prostate cancer", "CONDITION", "C61"),
            ("colon cancer", "CONDITION", "C18"),
            ("leukemia", "CONDITION", "C95"),
        ]
        
        batch = []
        for term, category, code in icd10_terms:
            batch.append((term, category, 'ICD-10', code, 0.94, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_hpo_phenotypes(self) -> int:
        """Add Human Phenotype Ontology terms"""
        hpo_terms = [
            # Symptoms
            ("chest pain", "SYMPTOM", "HP:0100749"),
            ("shortness of breath", "SYMPTOM", "HP:0002094"),
            ("headache", "SYMPTOM", "HP:0002315"),
            ("nausea", "SYMPTOM", "HP:0002018"),
            ("vomiting", "SYMPTOM", "HP:0002013"),
            ("dizziness", "SYMPTOM", "HP:0002321"),
            ("fatigue", "SYMPTOM", "HP:0012378"),
            ("fever", "SYMPTOM", "HP:0001945"),
            ("cough", "SYMPTOM", "HP:0012735"),
            ("abdominal pain", "SYMPTOM", "HP:0002027"),
            ("back pain", "SYMPTOM", "HP:0003418"),
            ("joint pain", "SYMPTOM", "HP:0002829"),
            ("muscle weakness", "SYMPTOM", "HP:0001324"),
            ("seizure", "SYMPTOM", "HP:0001250"),
            ("confusion", "SYMPTOM", "HP:0001289"),
            ("memory loss", "SYMPTOM", "HP:0002354"),
            ("blurred vision", "SYMPTOM", "HP:0000622"),
            ("hearing loss", "SYMPTOM", "HP:0000365"),
            ("rash", "SYMPTOM", "HP:0000988"),
            ("swelling", "SYMPTOM", "HP:0000969"),
            ("numbness", "SYMPTOM", "HP:0003401"),
            ("tingling", "SYMPTOM", "HP:0003401"),
            ("palpitations", "SYMPTOM", "HP:0001962"),
            ("night sweats", "SYMPTOM", "HP:0000989"),
            ("weight loss", "SYMPTOM", "HP:0001824"),
            ("weight gain", "SYMPTOM", "HP:0004324"),
            ("loss of appetite", "SYMPTOM", "HP:0002039"),
            ("difficulty swallowing", "SYMPTOM", "HP:0002015"),
            ("constipation", "SYMPTOM", "HP:0002019"),
            ("diarrhea", "SYMPTOM", "HP:0002014"),
        ]
        
        batch = []
        for term, category, code in hpo_terms:
            batch.append((term, category, 'HPO', code, 0.94, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_snomed_sample(self) -> int:
        """Add SNOMED CT sample terms"""
        snomed_terms = [
            # Procedures
            ("appendectomy", "PROCEDURE", "80146002"),
            ("cholecystectomy", "PROCEDURE", "38102005"),
            ("coronary angioplasty", "PROCEDURE", "11101003"),
            ("hip replacement", "PROCEDURE", "52734007"),
            ("knee replacement", "PROCEDURE", "609588000"),
            ("cataract surgery", "PROCEDURE", "54885007"),
            ("tonsillectomy", "PROCEDURE", "173422009"),
            ("hysterectomy", "PROCEDURE", "236886002"),
            ("mastectomy", "PROCEDURE", "172043006"),
            ("prostatectomy", "PROCEDURE", "176258007"),
            
            # Anatomy
            ("myocardium", "ANATOMY", "74281007"),
            ("pericardium", "ANATOMY", "76848001"),
            ("endocardium", "ANATOMY", "27878003"),
            ("aorta", "ANATOMY", "15825003"),
            ("pulmonary artery", "ANATOMY", "81040000"),
            ("coronary artery", "ANATOMY", "41801008"),
            ("cerebrum", "ANATOMY", "83678007"),
            ("cerebellum", "ANATOMY", "113305005"),
            ("brainstem", "ANATOMY", "15926001"),
            ("spinal cord", "ANATOMY", "2748008"),
        ]
        
        batch = []
        for term, category, code in snomed_terms:
            batch.append((term, category, 'SNOMED-CT', code, 0.96, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_rxnorm_sample(self) -> int:
        """Add RxNorm medication terms"""
        rxnorm_terms = [
            ("acetaminophen", "MEDICATION", "161"),
            ("ibuprofen", "MEDICATION", "5640"),
            ("aspirin", "MEDICATION", "1191"),
            ("metformin", "MEDICATION", "6809"),
            ("lisinopril", "MEDICATION", "29046"),
            ("atorvastatin", "MEDICATION", "83367"),
            ("amlodipine", "MEDICATION", "17767"),
            ("metoprolol", "MEDICATION", "6918"),
            ("omeprazole", "MEDICATION", "7646"),
            ("levothyroxine", "MEDICATION", "10582"),
            ("warfarin", "MEDICATION", "11289"),
            ("insulin", "MEDICATION", "5856"),
            ("prednisone", "MEDICATION", "8640"),
            ("albuterol", "MEDICATION", "435"),
            ("furosemide", "MEDICATION", "4603"),
            ("gabapentin", "MEDICATION", "25480"),
            ("tramadol", "MEDICATION", "10689"),
            ("morphine", "MEDICATION", "7052"),
            ("oxycodone", "MEDICATION", "7804"),
            ("amoxicillin", "MEDICATION", "723"),
        ]
        
        batch = []
        for term, code in rxnorm_terms:
            batch.append((term, "MEDICATION", 'RxNorm', code, 0.95, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_medical_abbreviations(self) -> int:
        """Add common medical abbreviations"""
        abbreviations = [
            # Vital signs
            ("bp", "VITAL_SIGNS", "blood pressure"),
            ("hr", "VITAL_SIGNS", "heart rate"),
            ("rr", "VITAL_SIGNS", "respiratory rate"),
            ("temp", "VITAL_SIGNS", "temperature"),
            ("o2 sat", "VITAL_SIGNS", "oxygen saturation"),
            ("spo2", "VITAL_SIGNS", "oxygen saturation"),
            
            # Lab values
            ("hgb", "LAB_VALUES", "hemoglobin"),
            ("hct", "LAB_VALUES", "hematocrit"),
            ("wbc", "LAB_VALUES", "white blood cell"),
            ("rbc", "LAB_VALUES", "red blood cell"),
            ("plt", "LAB_VALUES", "platelet"),
            ("bun", "LAB_VALUES", "blood urea nitrogen"),
            ("creat", "LAB_VALUES", "creatinine"),
            ("glu", "LAB_VALUES", "glucose"),
            ("chol", "LAB_VALUES", "cholesterol"),
            ("trig", "LAB_VALUES", "triglycerides"),
            ("hba1c", "LAB_VALUES", "hemoglobin a1c"),
            ("tsh", "LAB_VALUES", "thyroid stimulating hormone"),
            ("t4", "LAB_VALUES", "thyroxine"),
            ("t3", "LAB_VALUES", "triiodothyronine"),
            
            # Procedures
            ("ekg", "PROCEDURE", "electrocardiogram"),
            ("ecg", "PROCEDURE", "electrocardiogram"),
            ("echo", "PROCEDURE", "echocardiogram"),
            ("ct", "PROCEDURE", "computed tomography"),
            ("mri", "PROCEDURE", "magnetic resonance imaging"),
            ("us", "PROCEDURE", "ultrasound"),
            ("cxr", "PROCEDURE", "chest x-ray"),
            ("eeg", "PROCEDURE", "electroencephalogram"),
            ("emg", "PROCEDURE", "electromyogram"),
            
            # Conditions
            ("mi", "CONDITION", "myocardial infarction"),
            ("chf", "CONDITION", "congestive heart failure"),
            ("copd", "CONDITION", "chronic obstructive pulmonary disease"),
            ("dm", "CONDITION", "diabetes mellitus"),
            ("htn", "CONDITION", "hypertension"),
            ("cad", "CONDITION", "coronary artery disease"),
            ("pe", "CONDITION", "pulmonary embolism"),
            ("dvt", "CONDITION", "deep vein thrombosis"),
            ("uti", "CONDITION", "urinary tract infection"),
            ("uri", "CONDITION", "upper respiratory infection"),
        ]
        
        batch = []
        for abbrev, category, full_term in abbreviations:
            batch.append((abbrev, category, 'Medical-Abbrev', full_term, 0.90, abbrev.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_common_medical_terms(self) -> int:
        """Add common medical terms and phrases"""
        common_terms = [
            # Chief complaints
            ("chief complaint", "CLINICAL", "CC"),
            ("history of present illness", "CLINICAL", "HPI"),
            ("past medical history", "CLINICAL", "PMH"),
            ("family history", "CLINICAL", "FH"),
            ("social history", "CLINICAL", "SH"),
            ("review of systems", "CLINICAL", "ROS"),
            ("physical examination", "CLINICAL", "PE"),
            ("assessment and plan", "CLINICAL", "A&P"),
            
            # Physical exam findings
            ("normal", "FINDING", "WNL"),
            ("abnormal", "FINDING", "ABN"),
            ("unremarkable", "FINDING", "WNL"),
            ("within normal limits", "FINDING", "WNL"),
            ("no acute distress", "FINDING", "NAD"),
            ("alert and oriented", "FINDING", "A&O"),
            ("well appearing", "FINDING", "WA"),
            ("ill appearing", "FINDING", "IA"),
            
            # Medications
            ("as needed", "MEDICATION", "PRN"),
            ("twice daily", "MEDICATION", "BID"),
            ("three times daily", "MEDICATION", "TID"),
            ("four times daily", "MEDICATION", "QID"),
            ("once daily", "MEDICATION", "QD"),
            ("every other day", "MEDICATION", "QOD"),
            ("at bedtime", "MEDICATION", "HS"),
            ("before meals", "MEDICATION", "AC"),
            ("after meals", "MEDICATION", "PC"),
            
            # Allergies
            ("no known allergies", "ALLERGY", "NKA"),
            ("no known drug allergies", "ALLERGY", "NKDA"),
            ("penicillin allergy", "ALLERGY", "PCN"),
            ("sulfa allergy", "ALLERGY", "Sulfa"),
            ("latex allergy", "ALLERGY", "Latex"),
        ]
        
        batch = []
        for term, category, code in common_terms:
            batch.append((term, category, 'Medical-Common', code, 0.88, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_lab_reference_values(self) -> int:
        """Add lab reference values and ranges"""
        lab_values = [
            # Hematology
            ("hemoglobin normal", "LAB_VALUES", "12-16 g/dL"),
            ("hematocrit normal", "LAB_VALUES", "36-46%"),
            ("white blood cell normal", "LAB_VALUES", "4.5-11.0 K/uL"),
            ("platelet normal", "LAB_VALUES", "150-450 K/uL"),
            
            # Chemistry
            ("glucose normal", "LAB_VALUES", "70-100 mg/dL"),
            ("creatinine normal", "LAB_VALUES", "0.6-1.2 mg/dL"),
            ("bun normal", "LAB_VALUES", "7-20 mg/dL"),
            ("sodium normal", "LAB_VALUES", "136-145 mEq/L"),
            ("potassium normal", "LAB_VALUES", "3.5-5.0 mEq/L"),
            ("chloride normal", "LAB_VALUES", "98-107 mEq/L"),
            
            # Lipids
            ("total cholesterol normal", "LAB_VALUES", "<200 mg/dL"),
            ("ldl normal", "LAB_VALUES", "<100 mg/dL"),
            ("hdl normal", "LAB_VALUES", ">40 mg/dL"),
            ("triglycerides normal", "LAB_VALUES", "<150 mg/dL"),
            
            # Liver function
            ("alt normal", "LAB_VALUES", "7-56 U/L"),
            ("ast normal", "LAB_VALUES", "10-40 U/L"),
            ("bilirubin normal", "LAB_VALUES", "0.3-1.2 mg/dL"),
            ("albumin normal", "LAB_VALUES", "3.5-5.0 g/dL"),
        ]
        
        batch = []
        for term, category, reference in lab_values:
            batch.append((term, category, 'Lab-Reference', reference, 0.85, term.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _expand_medical_specialties(self) -> int:
        """Add medical specialties and departments"""
        specialties = [
            ("cardiology", "SPECIALTY", "Heart and vascular"),
            ("pulmonology", "SPECIALTY", "Lungs and respiratory"),
            ("gastroenterology", "SPECIALTY", "Digestive system"),
            ("neurology", "SPECIALTY", "Nervous system"),
            ("endocrinology", "SPECIALTY", "Hormones and metabolism"),
            ("nephrology", "SPECIALTY", "Kidneys"),
            ("hematology", "SPECIALTY", "Blood disorders"),
            ("oncology", "SPECIALTY", "Cancer"),
            ("rheumatology", "SPECIALTY", "Autoimmune and joint"),
            ("dermatology", "SPECIALTY", "Skin"),
            ("ophthalmology", "SPECIALTY", "Eyes"),
            ("otolaryngology", "SPECIALTY", "Ear, nose, throat"),
            ("urology", "SPECIALTY", "Urinary system"),
            ("gynecology", "SPECIALTY", "Women's health"),
            ("orthopedics", "SPECIALTY", "Bones and joints"),
            ("psychiatry", "SPECIALTY", "Mental health"),
            ("emergency medicine", "SPECIALTY", "Emergency care"),
            ("family medicine", "SPECIALTY", "Primary care"),
            ("internal medicine", "SPECIALTY", "Adult medicine"),
            ("pediatrics", "SPECIALTY", "Children's medicine"),
        ]
        
        batch = []
        for specialty, category, description in specialties:
            batch.append((specialty, category, 'Medical-Specialty', description, 0.87, specialty.lower()))
        
        self._insert_batch(batch)
        return len(batch)
    
    def _categorize_loinc_term(self, term: str) -> str:
        """Categorize LOINC terms"""
        term_lower = term.lower()
        
        if any(word in term_lower for word in ['pressure', 'heart rate', 'temperature', 'weight', 'height', 'pulse']):
            return "VITAL_SIGNS"
        elif any(word in term_lower for word in ['glucose', 'cholesterol', 'hemoglobin', 'creatinine', 'sodium', 'potassium']):
            return "LAB_VALUES"
        else:
            return "LAB_VALUES"
    
    def _insert_batch(self, batch: List[Tuple]):
        """Insert batch of terms"""
        self.conn.executemany("""
            INSERT OR IGNORE INTO medical_terms (term, category, source_db, code, confidence, term_lower)
            VALUES (?, ?, ?, ?, ?, ?)
        """, batch)
        self.conn.commit()
    
    def get_expansion_stats(self) -> Dict[str, Any]:
        """Get database statistics after expansion"""
        cursor = self.conn.cursor()
        
        # Total terms
        cursor.execute("SELECT COUNT(*) FROM medical_terms")
        total_terms = cursor.fetchone()[0]
        
        # Terms by source
        cursor.execute("""
            SELECT source_db, COUNT(*) 
            FROM medical_terms 
            GROUP BY source_db 
            ORDER BY COUNT(*) DESC
        """)
        sources = dict(cursor.fetchall())
        
        # Terms by category
        cursor.execute("""
            SELECT category, COUNT(*) 
            FROM medical_terms 
            GROUP BY category 
            ORDER BY COUNT(*) DESC
        """)
        categories = dict(cursor.fetchall())
        
        return {
            "total_terms": total_terms,
            "sources": sources,
            "categories": categories,
            "database_size_mb": os.path.getsize(self.db_path) / 1024 / 1024
        }
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

if __name__ == "__main__":
    expander = MedicalDatabaseExpander()
    expander.expand_database()
    
    stats = expander.get_expansion_stats()
    print(f"\n📊 FINAL DATABASE STATISTICS:")
    print(f"  Total terms: {stats['total_terms']:,}")
    print(f"  Database size: {stats['database_size_mb']:.1f} MB")
    print(f"  Sources: {len(stats['sources'])}")
    print(f"  Categories: {len(stats['categories'])}")
    
    print(f"\n📋 Terms by source:")
    for source, count in stats['sources'].items():
        print(f"  {source}: {count:,}")
    
    expander.close()
    print(f"\n🎉 Medical database expansion complete!")
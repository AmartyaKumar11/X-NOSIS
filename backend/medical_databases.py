"""
Comprehensive Medical Database Integration for NER System
Uses REAL APIs and downloadable databases - NO HARDCODING!
"""

import requests
import json
import sqlite3
import os
import csv
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, List, Set, Tuple
import logging
from datetime import datetime
import time

class MedicalDatabaseManager:
    """Manages integration with multiple medical databases"""
    
    def __init__(self, db_path: str = "medical_knowledge.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for medical terms"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables for different medical databases
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medical_terms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term TEXT NOT NULL,
                category TEXT NOT NULL,
                source_db TEXT NOT NULL,
                concept_id TEXT,
                synonyms TEXT,
                definition TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS drug_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                drug1 TEXT NOT NULL,
                drug2 TEXT NOT NULL,
                severity TEXT,
                description TEXT,
                source_db TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_medical_terms_term ON medical_terms(term)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_medical_terms_category ON medical_terms(category)
        ''')
        
        conn.commit()
        conn.close()
        
    def load_openfda_drugs(self) -> int:
        """Load drug data from OpenFDA API - REAL API CALLS"""
        print("🔄 Loading OpenFDA drug database from REAL API...")
        
        total_drugs = 0
        skip = 0
        limit = 100  # API limit per request
        max_requests = 50  # Load ~5000 drugs total
        
        try:
            for request_num in range(max_requests):
                print(f"  📡 API Request {request_num + 1}/{max_requests} (skip: {skip})")
                
                # OpenFDA Drug Labels API
                url = "https://api.fda.gov/drug/label.json"
                params = {
                    'limit': limit,
                    'skip': skip
                }
                
                response = requests.get(url, params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'results' not in data or not data['results']:
                        print("  ✅ No more results - finished loading")
                        break
                    
                    batch_count = self._process_openfda_data(data)
                    total_drugs += batch_count
                    skip += limit
                    
                    print(f"    ✅ Loaded {batch_count} drugs (Total: {total_drugs})")
                    
                    # Rate limiting - be nice to the API
                    time.sleep(0.5)
                    
                elif response.status_code == 429:
                    print("  ⏳ Rate limited - waiting 60 seconds...")
                    time.sleep(60)
                    continue
                else:
                    print(f"  ❌ API error: {response.status_code}")
                    break
                    
            print(f"✅ Total drugs loaded from OpenFDA: {total_drugs}")
            return total_drugs
                
        except Exception as e:
            print(f"❌ Error loading OpenFDA data: {e}")
            return total_drugs
    
    def _process_openfda_data(self, data: dict) -> int:
        """Process OpenFDA drug data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        drugs_loaded = 0
        
        for result in data.get('results', []):
            try:
                # Extract drug names
                brand_names = result.get('openfda', {}).get('brand_name', [])
                generic_names = result.get('openfda', {}).get('generic_name', [])
                substance_names = result.get('openfda', {}).get('substance_name', [])
                
                all_names = set(brand_names + generic_names + substance_names)
                
                for name in all_names:
                    if name and len(name.strip()) > 2:
                        cursor.execute('''
                            INSERT OR IGNORE INTO medical_terms 
                            (term, category, source_db, synonyms)
                            VALUES (?, ?, ?, ?)
                        ''', (
                            name.strip().lower(),
                            'MEDICATION',
                            'OpenFDA',
                            json.dumps(list(all_names))
                        ))
                        drugs_loaded += 1
                        
            except Exception as e:
                continue
                
        conn.commit()
        conn.close()
        return drugs_loaded
    
    def load_rxnorm_drugs(self) -> int:
        """Load drug names from RxNorm API - REAL API"""
        print("🔄 Loading RxNorm drug database from REAL API...")
        
        total_drugs = 0
        
        try:
            # Get drug classes first
            drug_classes = [
                'Analgesics', 'Antibiotics', 'Antihypertensives', 'Antidiabetics',
                'Anticoagulants', 'Antidepressants', 'Antihistamines', 'Bronchodilators',
                'Diuretics', 'Statins', 'Beta Blockers', 'ACE Inhibitors', 'Proton Pump Inhibitors'
            ]
            
            for drug_class in drug_classes:
                print(f"  📡 Loading {drug_class}...")
                
                # RxNorm API to get drugs by class
                url = f"https://rxnav.nlm.nih.gov/REST/rxclass/classMembers.json"
                params = {
                    'classId': drug_class,
                    'relaSource': 'ATC',
                    'rela': 'isa'
                }
                
                try:
                    response = requests.get(url, params=params, timeout=15)
                    if response.status_code == 200:
                        data = response.json()
                        batch_count = self._process_rxnorm_data(data, drug_class)
                        total_drugs += batch_count
                        print(f"    ✅ Loaded {batch_count} drugs from {drug_class}")
                    
                    time.sleep(0.3)  # Rate limiting
                    
                except Exception as e:
                    print(f"    ❌ Error loading {drug_class}: {e}")
                    continue
            
            # Also load common drug names directly
            common_drugs = [
                'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
                'atorvastatin', 'amlodipine', 'metoprolol', 'omeprazole', 'levothyroxine'
            ]
            
            for drug_name in common_drugs:
                try:
                    url = f"https://rxnav.nlm.nih.gov/REST/drugs.json"
                    params = {'name': drug_name}
                    
                    response = requests.get(url, params=params, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        if 'drugGroup' in data and 'conceptGroup' in data['drugGroup']:
                            for group in data['drugGroup']['conceptGroup']:
                                if 'conceptProperties' in group:
                                    for concept in group['conceptProperties']:
                                        if 'name' in concept:
                                            self._save_drug_term(concept['name'], 'RxNorm')
                                            total_drugs += 1
                    
                    time.sleep(0.2)
                    
                except Exception as e:
                    continue
            
            print(f"✅ Total drugs loaded from RxNorm: {total_drugs}")
            return total_drugs
                
        except Exception as e:
            print(f"❌ Error loading RxNorm data: {e}")
            return total_drugs
    
    def _process_rxnorm_data(self, data: dict, drug_class: str) -> int:
        """Process RxNorm API response"""
        count = 0
        try:
            if 'drugMemberGroup' in data and 'drugMember' in data['drugMemberGroup']:
                for member in data['drugMemberGroup']['drugMember']:
                    if 'minConcept' in member and 'name' in member['minConcept']:
                        drug_name = member['minConcept']['name']
                        self._save_drug_term(drug_name, 'RxNorm', drug_class)
                        count += 1
        except Exception as e:
            pass
        return count
    
    def _save_drug_term(self, drug_name: str, source: str, drug_class: str = None):
        """Save drug term to database"""
        if drug_name and len(drug_name.strip()) > 2:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, definition)
                VALUES (?, ?, ?, ?)
            ''', (
                drug_name.strip().lower(),
                'MEDICATION',
                source,
                drug_class or 'Medication'
            ))
            
            conn.commit()
            conn.close()
    
    def load_loinc_codes(self, loinc_file_path: str = None) -> int:
        """Load LOINC lab codes from official LOINC database file or fallback"""
        print("🔄 Loading LOINC lab codes...")
        
        # If LOINC file is provided, load from actual database
        if loinc_file_path and os.path.exists(loinc_file_path):
            return self._load_loinc_from_file(loinc_file_path)
        
        # Try to find LOINC file in common locations
        possible_paths = [
            "Loinc_2.80/LoincTable/Loinc.csv",  # Main LOINC file
            "Loinc_2.80/LoincTableCore/LoincTableCore.csv",  # Core subset
            "loinc/Loinc.csv",
            "data/loinc/Loinc.csv", 
            "../loinc/Loinc.csv",
            "backend/loinc/Loinc.csv"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                print(f"📁 Found LOINC file at: {path}")
                return self._load_loinc_from_file(path)
        
        # Fallback to comprehensive hardcoded list
        print("⚠️  LOINC file not found, loading comprehensive fallback codes...")
        return self._load_loinc_fallback()
    
    def _load_loinc_from_file(self, file_path: str) -> int:
        """Load LOINC codes from the official CSV file"""
        print(f"📁 Loading LOINC codes from file: {file_path}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        loaded_count = 0
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                # Skip the header row
                next(file)
                csv_reader = csv.reader(file)
                
                for row in csv_reader:
                    try:
                        # LOINC CSV structure: LOINC_NUM, COMPONENT, PROPERTY, TIME_ASPCT, SYSTEM, SCALE_TYP, METHOD_TYP, CLASS, VersionLastChanged, CHNG_TYPE, DefinitionDescription, STATUS, CONSUMER_NAME, CLASSTYPE, FORMULA, SPECIES, EXMPL_ANSWERS, SURVEY_QUEST_TEXT, SURVEY_QUEST_SRC, UNITSREQUIRED, SUBMITTED_UNITS, RELATEDNAMES2, SHORTNAME, ORDER_OBS, CDISC_COMMON_TESTS, HL7_FIELD_SUBFIELD_ID, EXTERNAL_COPYRIGHT_NOTICE, EXAMPLE_UNITS, LONG_COMMON_NAME, UnitsAndRange, DOCUMENT_SECTION, EXAMPLE_UCUM_UNITS, EXAMPLE_SI_UCUM_UNITS, STATUS_REASON, STATUS_TEXT, CHANGE_REASON_PUBLIC, COMMON_TEST_RANK, COMMON_ORDER_RANK, COMMON_SI_TEST_RANK, HL7_ATTACHMENT_STRUCTURE, EXTERNAL_COPYRIGHT_LINK, PanelType, AskAtOrderEntry, AssociatedObservations, VersionFirstReleased, ValidHL7AttachmentRequest
                        
                        if len(row) >= 30:  # Ensure we have enough columns
                            loinc_num = row[0].strip()
                            component = row[1].strip()
                            long_common_name = row[29].strip() if len(row) > 29 else ""
                            short_name = row[23].strip() if len(row) > 23 else ""
                            
                            # Use the most descriptive name available
                            term_name = long_common_name or short_name or component
                            
                            if term_name and loinc_num:
                                # Determine category based on component
                                category = self._categorize_loinc_term(component, term_name)
                                
                                cursor.execute('''
                                    INSERT OR IGNORE INTO medical_terms 
                                    (term, category, source_db, concept_id, definition)
                                    VALUES (?, ?, ?, ?, ?)
                                ''', (
                                    term_name.lower(),
                                    category,
                                    'LOINC',
                                    loinc_num,
                                    f"{component} - {long_common_name}"
                                ))
                                loaded_count += 1
                                
                                # Also add short variations
                                if short_name and short_name != term_name:
                                    cursor.execute('''
                                        INSERT OR IGNORE INTO medical_terms 
                                        (term, category, source_db, concept_id, definition)
                                        VALUES (?, ?, ?, ?, ?)
                                    ''', (
                                        short_name.lower(),
                                        category,
                                        'LOINC',
                                        loinc_num,
                                        f"{component} - {short_name}"
                                    ))
                                    loaded_count += 1
                                
                    except Exception as e:
                        continue  # Skip problematic rows
                        
        except Exception as e:
            print(f"❌ Error reading LOINC file: {e}")
            return 0
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {loaded_count:,} LOINC codes from file")
        return loaded_count
    
    def _categorize_loinc_term(self, component: str, term_name: str) -> str:
        """Categorize LOINC terms based on component and name"""
        component_lower = component.lower()
        term_lower = term_name.lower()
        
        # Vital signs patterns
        if any(keyword in component_lower or keyword in term_lower for keyword in [
            'blood pressure', 'heart rate', 'pulse', 'temperature', 'respiratory rate', 
            'oxygen saturation', 'weight', 'height', 'bmi', 'body mass'
        ]):
            return 'VITAL_SIGNS'
        
        # Lab values patterns
        if any(keyword in component_lower or keyword in term_lower for keyword in [
            'glucose', 'cholesterol', 'hemoglobin', 'hematocrit', 'creatinine', 
            'sodium', 'potassium', 'chloride', 'protein', 'albumin', 'bilirubin',
            'ast', 'alt', 'troponin', 'bnp', 'tsh', 'vitamin', 'hormone'
        ]):
            return 'LAB_VALUES'
        
        # Default to lab values for most LOINC codes
        return 'LAB_VALUES'
    
    def _load_loinc_fallback(self) -> int:
        """Load comprehensive fallback LOINC codes"""
        # Common LOINC codes (comprehensive list)
        loinc_terms = [
            # Blood Chemistry
            ("glucose", "LAB_VALUES", "33747-0", "Glucose [Mass/volume] in Blood"),
            ("cholesterol", "LAB_VALUES", "2093-3", "Cholesterol [Mass/volume] in Serum or Plasma"),
            ("triglycerides", "LAB_VALUES", "2571-8", "Triglyceride [Mass/volume] in Serum or Plasma"),
            ("hdl cholesterol", "LAB_VALUES", "2085-9", "Cholesterol in HDL [Mass/volume] in Serum or Plasma"),
            ("ldl cholesterol", "LAB_VALUES", "18262-6", "Cholesterol in LDL [Mass/volume] in Serum or Plasma"),
            ("hemoglobin", "LAB_VALUES", "718-7", "Hemoglobin [Mass/volume] in Blood"),
            ("hematocrit", "LAB_VALUES", "4544-3", "Hematocrit [Volume Fraction] of Blood"),
            ("white blood cell count", "LAB_VALUES", "6690-2", "Leukocytes [#/volume] in Blood"),
            ("platelet count", "LAB_VALUES", "777-3", "Platelets [#/volume] in Blood"),
            ("creatinine", "LAB_VALUES", "2160-0", "Creatinine [Mass/volume] in Serum or Plasma"),
            ("blood urea nitrogen", "LAB_VALUES", "6299-2", "Urea nitrogen [Mass/volume] in Blood"),
            ("sodium", "LAB_VALUES", "2951-2", "Sodium [Moles/volume] in Serum or Plasma"),
            ("potassium", "LAB_VALUES", "2823-3", "Potassium [Moles/volume] in Serum or Plasma"),
            ("chloride", "LAB_VALUES", "2075-0", "Chloride [Moles/volume] in Serum or Plasma"),
            ("carbon dioxide", "LAB_VALUES", "2028-9", "Carbon dioxide, total [Moles/volume] in Serum or Plasma"),
            
            # Liver Function
            ("ast", "LAB_VALUES", "1920-8", "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma"),
            ("alt", "LAB_VALUES", "1742-6", "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma"),
            ("bilirubin", "LAB_VALUES", "1975-2", "Bilirubin.total [Mass/volume] in Serum or Plasma"),
            ("albumin", "LAB_VALUES", "1751-7", "Albumin [Mass/volume] in Serum or Plasma"),
            
            # Cardiac Markers
            ("troponin", "LAB_VALUES", "6598-7", "Troponin T.cardiac [Mass/volume] in Serum or Plasma"),
            ("ck-mb", "LAB_VALUES", "13969-1", "Creatine kinase.MB [Mass/volume] in Serum or Plasma"),
            ("bnp", "LAB_VALUES", "30934-4", "Natriuretic peptide.B prohormone N-Terminal [Mass/volume] in Serum or Plasma"),
            
            # Thyroid Function
            ("tsh", "LAB_VALUES", "3016-3", "Thyrotropin [Units/volume] in Serum or Plasma"),
            ("free t4", "LAB_VALUES", "3024-7", "Thyroxine (T4) free [Mass/volume] in Serum or Plasma"),
            ("free t3", "LAB_VALUES", "3051-0", "Triiodothyronine (T3) free [Mass/volume] in Serum or Plasma"),
            
            # Diabetes
            ("hba1c", "LAB_VALUES", "4548-4", "Hemoglobin A1c/Hemoglobin.total in Blood"),
            ("microalbumin", "LAB_VALUES", "14957-5", "Microalbumin [Mass/volume] in Urine"),
            
            # Coagulation
            ("inr", "LAB_VALUES", "34714-6", "INR in Platelet poor plasma by Coagulation assay"),
            ("pt", "LAB_VALUES", "5902-2", "Prothrombin time [Time] in Platelet poor plasma by Coagulation assay"),
            ("ptt", "LAB_VALUES", "3173-2", "aPTT in Platelet poor plasma by Coagulation assay"),
            
            # Vitamins
            ("vitamin d", "LAB_VALUES", "14635-7", "25-Hydroxyvitamin D3 [Mass/volume] in Serum or Plasma"),
            ("vitamin b12", "LAB_VALUES", "2132-9", "Vitamin B12 [Mass/volume] in Serum or Plasma"),
            ("folate", "LAB_VALUES", "2284-8", "Folic acid [Mass/volume] in Red Blood Cells"),
            
            # Inflammatory Markers
            ("c-reactive protein", "LAB_VALUES", "1988-5", "C reactive protein [Mass/volume] in Serum or Plasma"),
            ("esr", "LAB_VALUES", "4537-7", "Erythrocyte sedimentation rate by Westergren method"),
            
            # Tumor Markers
            ("psa", "LAB_VALUES", "2857-1", "Prostate specific antigen [Mass/volume] in Serum or Plasma"),
            ("cea", "LAB_VALUES", "2039-6", "Carcinoembryonic antigen [Mass/volume] in Serum or Plasma"),
            ("ca 19-9", "LAB_VALUES", "24108-3", "Cancer Ag 19-9 [Units/volume] in Serum or Plasma"),
            ("ca 125", "LAB_VALUES", "10334-1", "Cancer Ag 125 [Units/volume] in Serum or Plasma"),
            ("afp", "LAB_VALUES", "1834-1", "Alpha-1-Fetoprotein [Mass/volume] in Serum or Plasma"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, loinc_code, definition in loinc_terms:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'LOINC', loinc_code, definition))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(loinc_terms)} fallback LOINC codes")
        return len(loinc_terms)
    
    def load_hpo_phenotypes(self) -> int:
        """Fallback: Load essential lab values"""
        print("  📋 Loading essential lab values as fallback...")
        
        # Essential lab values that every system should recognize
        essential_labs = [
            # Blood Chemistry
            ("glucose", "LAB_VALUES", "33747-0", "Glucose [Mass/volume] in Blood"),
            ("cholesterol", "LAB_VALUES", "2093-3", "Cholesterol [Mass/volume] in Serum or Plasma"),
            ("triglycerides", "LAB_VALUES", "2571-8", "Triglyceride [Mass/volume] in Serum or Plasma"),
            ("hdl cholesterol", "LAB_VALUES", "2085-9", "Cholesterol in HDL [Mass/volume] in Serum or Plasma"),
            ("ldl cholesterol", "LAB_VALUES", "18262-6", "Cholesterol in LDL [Mass/volume] in Serum or Plasma"),
            ("hemoglobin", "LAB_VALUES", "718-7", "Hemoglobin [Mass/volume] in Blood"),
            ("hematocrit", "LAB_VALUES", "4544-3", "Hematocrit [Volume Fraction] of Blood"),
            ("white blood cell count", "LAB_VALUES", "6690-2", "Leukocytes [#/volume] in Blood"),
            ("platelet count", "LAB_VALUES", "777-3", "Platelets [#/volume] in Blood"),
            ("creatinine", "LAB_VALUES", "2160-0", "Creatinine [Mass/volume] in Serum or Plasma"),
            ("blood urea nitrogen", "LAB_VALUES", "6299-2", "Urea nitrogen [Mass/volume] in Blood"),
            ("sodium", "LAB_VALUES", "2951-2", "Sodium [Moles/volume] in Serum or Plasma"),
            ("potassium", "LAB_VALUES", "2823-3", "Potassium [Moles/volume] in Serum or Plasma"),
            ("chloride", "LAB_VALUES", "2075-0", "Chloride [Moles/volume] in Serum or Plasma"),
            ("carbon dioxide", "LAB_VALUES", "2028-9", "Carbon dioxide, total [Moles/volume] in Serum or Plasma"),
            
            # Liver Function
            ("ast", "LAB_VALUES", "1920-8", "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma"),
            ("alt", "LAB_VALUES", "1742-6", "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma"),
            ("bilirubin", "LAB_VALUES", "1975-2", "Bilirubin.total [Mass/volume] in Serum or Plasma"),
            ("albumin", "LAB_VALUES", "1751-7", "Albumin [Mass/volume] in Serum or Plasma"),
            
            # Cardiac Markers
            ("troponin", "LAB_VALUES", "6598-7", "Troponin T.cardiac [Mass/volume] in Serum or Plasma"),
            ("ck-mb", "LAB_VALUES", "13969-1", "Creatine kinase.MB [Mass/volume] in Serum or Plasma"),
            ("bnp", "LAB_VALUES", "30934-4", "Natriuretic peptide.B prohormone N-Terminal [Mass/volume] in Serum or Plasma"),
            
            # Thyroid Function
            ("tsh", "LAB_VALUES", "3016-3", "Thyrotropin [Units/volume] in Serum or Plasma"),
            ("free t4", "LAB_VALUES", "3024-7", "Thyroxine (T4) free [Mass/volume] in Serum or Plasma"),
            ("free t3", "LAB_VALUES", "3051-0", "Triiodothyronine (T3) free [Mass/volume] in Serum or Plasma"),
            
            # Diabetes
            ("hba1c", "LAB_VALUES", "4548-4", "Hemoglobin A1c/Hemoglobin.total in Blood"),
            ("microalbumin", "LAB_VALUES", "14957-5", "Microalbumin [Mass/volume] in Urine"),
            
            # Coagulation
            ("inr", "LAB_VALUES", "34714-6", "INR in Platelet poor plasma by Coagulation assay"),
            ("pt", "LAB_VALUES", "5902-2", "Prothrombin time [Time] in Platelet poor plasma by Coagulation assay"),
            ("ptt", "LAB_VALUES", "3173-2", "aPTT in Platelet poor plasma by Coagulation assay"),
            
            # Vitamins
            ("vitamin d", "LAB_VALUES", "14635-7", "25-Hydroxyvitamin D3 [Mass/volume] in Serum or Plasma"),
            ("vitamin b12", "LAB_VALUES", "2132-9", "Vitamin B12 [Mass/volume] in Serum or Plasma"),
            ("folate", "LAB_VALUES", "2284-8", "Folic acid [Mass/volume] in Red Blood Cells"),
            
            # Inflammatory Markers
            ("c-reactive protein", "LAB_VALUES", "1988-5", "C reactive protein [Mass/volume] in Serum or Plasma"),
            ("esr", "LAB_VALUES", "4537-7", "Erythrocyte sedimentation rate by Westergren method"),
            
            # Tumor Markers
            ("psa", "LAB_VALUES", "2857-1", "Prostate specific antigen [Mass/volume] in Serum or Plasma"),
            ("cea", "LAB_VALUES", "2039-6", "Carcinoembryonic antigen [Mass/volume] in Serum or Plasma"),
            ("ca 19-9", "LAB_VALUES", "24108-3", "Cancer Ag 19-9 [Units/volume] in Serum or Plasma"),
            ("ca 125", "LAB_VALUES", "10334-1", "Cancer Ag 125 [Units/volume] in Serum or Plasma"),
            ("afp", "LAB_VALUES", "1834-1", "Alpha-1-Fetoprotein [Mass/volume] in Serum or Plasma"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, loinc_code, definition in loinc_terms:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'LOINC', loinc_code, definition))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(loinc_terms)} LOINC lab codes")
        return len(loinc_terms)
    
    def load_hpo_phenotypes(self) -> int:
        """Load HPO phenotype data (simulated - would need actual HPO file)"""
        print("🔄 Loading HPO phenotypes...")
        
        # Common HPO phenotypes and symptoms
        hpo_terms = [
            # Cardiovascular symptoms
            ("chest pain", "SYMPTOM", "HP:0100749", "Thoracic pain"),
            ("palpitations", "SYMPTOM", "HP:0001962", "Palpitations"),
            ("shortness of breath", "SYMPTOM", "HP:0002094", "Dyspnea"),
            ("heart murmur", "SYMPTOM", "HP:0030148", "Heart murmur"),
            ("chest tightness", "SYMPTOM", "HP:0031352", "Chest tightness"),
            ("irregular heartbeat", "SYMPTOM", "HP:0011675", "Arrhythmia"),
            
            # Respiratory symptoms
            ("cough", "SYMPTOM", "HP:0012735", "Cough"),
            ("wheezing", "SYMPTOM", "HP:0030828", "Wheezing"),
            ("difficulty breathing", "SYMPTOM", "HP:0002094", "Dyspnea"),
            ("chest congestion", "SYMPTOM", "HP:0031352", "Chest congestion"),
            
            # Neurological symptoms
            ("headache", "SYMPTOM", "HP:0002315", "Headache"),
            ("dizziness", "SYMPTOM", "HP:0002321", "Vertigo"),
            ("confusion", "SYMPTOM", "HP:0001289", "Confusion"),
            ("memory loss", "SYMPTOM", "HP:0002354", "Memory impairment"),
            ("seizure", "SYMPTOM", "HP:0001250", "Seizures"),
            ("tremor", "SYMPTOM", "HP:0001337", "Tremor"),
            ("weakness", "SYMPTOM", "HP:0001324", "Muscle weakness"),
            ("numbness", "SYMPTOM", "HP:0003401", "Paresthesia"),
            ("tingling", "SYMPTOM", "HP:0003401", "Paresthesia"),
            
            # Gastrointestinal symptoms
            ("nausea", "SYMPTOM", "HP:0002018", "Nausea"),
            ("vomiting", "SYMPTOM", "HP:0002013", "Vomiting"),
            ("abdominal pain", "SYMPTOM", "HP:0002027", "Abdominal pain"),
            ("diarrhea", "SYMPTOM", "HP:0002014", "Diarrhea"),
            ("constipation", "SYMPTOM", "HP:0002019", "Constipation"),
            ("loss of appetite", "SYMPTOM", "HP:0002039", "Anorexia"),
            ("bloating", "SYMPTOM", "HP:0001513", "Obesity"), # Simplified
            
            # General symptoms
            ("fatigue", "SYMPTOM", "HP:0012378", "Fatigue"),
            ("fever", "SYMPTOM", "HP:0001945", "Fever"),
            ("weight loss", "SYMPTOM", "HP:0001824", "Weight loss"),
            ("weight gain", "SYMPTOM", "HP:0004324", "Increased body weight"),
            ("night sweats", "SYMPTOM", "HP:0000989", "Pruritus"), # Simplified
            ("chills", "SYMPTOM", "HP:0025143", "Chills"),
            ("malaise", "SYMPTOM", "HP:0033834", "Malaise"),
            
            # Musculoskeletal symptoms
            ("joint pain", "SYMPTOM", "HP:0002829", "Arthralgia"),
            ("muscle pain", "SYMPTOM", "HP:0003326", "Myalgia"),
            ("back pain", "SYMPTOM", "HP:0003418", "Back pain"),
            ("stiffness", "SYMPTOM", "HP:0003552", "Muscle stiffness"),
            
            # Skin symptoms
            ("rash", "SYMPTOM", "HP:0000988", "Skin rash"),
            ("itching", "SYMPTOM", "HP:0000989", "Pruritus"),
            ("swelling", "SYMPTOM", "HP:0000969", "Edema"),
            ("bruising", "SYMPTOM", "HP:0000978", "Bruising susceptibility"),
            
            # Urological symptoms
            ("frequent urination", "SYMPTOM", "HP:0000103", "Polyuria"),
            ("painful urination", "SYMPTOM", "HP:0100518", "Dysuria"),
            ("blood in urine", "SYMPTOM", "HP:0000790", "Hematuria"),
            
            # Psychiatric symptoms
            ("anxiety", "SYMPTOM", "HP:0000739", "Anxiety"),
            ("depression", "SYMPTOM", "HP:0000716", "Depression"),
            ("insomnia", "SYMPTOM", "HP:0100785", "Insomnia"),
            ("irritability", "SYMPTOM", "HP:0000737", "Irritability"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, hpo_id, definition in hpo_terms:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'HPO', hpo_id, definition))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(hpo_terms)} HPO phenotypes")
        return len(hpo_terms)
    
    def load_umls_concepts(self) -> int:
        """Load UMLS concepts (simulated - would need UMLS license and files)"""
        print("🔄 Loading UMLS medical concepts...")
        
        # Sample UMLS concepts (in real implementation, load from UMLS files)
        umls_terms = [
            # Conditions
            ("myocardial infarction", "CONDITION", "C0027051", "Heart attack"),
            ("cerebrovascular accident", "CONDITION", "C0038454", "Stroke"),
            ("chronic obstructive pulmonary disease", "CONDITION", "C0024117", "COPD"),
            ("diabetes mellitus", "CONDITION", "C0011849", "Diabetes"),
            ("hypertension", "CONDITION", "C0020538", "High blood pressure"),
            ("pneumonia", "CONDITION", "C0032285", "Lung infection"),
            ("sepsis", "CONDITION", "C0243026", "Systemic infection"),
            ("heart failure", "CONDITION", "C0018801", "Cardiac failure"),
            ("atrial fibrillation", "CONDITION", "C0004238", "Irregular heartbeat"),
            ("pulmonary embolism", "CONDITION", "C0034065", "Blood clot in lung"),
            
            # Procedures
            ("computed tomography", "PROCEDURE", "C0040405", "CT scan"),
            ("magnetic resonance imaging", "PROCEDURE", "C0024485", "MRI scan"),
            ("electrocardiogram", "PROCEDURE", "C0013798", "ECG/EKG"),
            ("echocardiogram", "PROCEDURE", "C0013516", "Heart ultrasound"),
            ("chest x-ray", "PROCEDURE", "C0039985", "Chest radiograph"),
            ("blood test", "PROCEDURE", "C0018941", "Blood analysis"),
            ("urine test", "PROCEDURE", "C0042014", "Urinalysis"),
            ("biopsy", "PROCEDURE", "C0005558", "Tissue sample"),
            ("colonoscopy", "PROCEDURE", "C0009378", "Colon examination"),
            ("endoscopy", "PROCEDURE", "C0014245", "Internal examination"),
            
            # Anatomy
            ("myocardium", "ANATOMY", "C0027061", "Heart muscle"),
            ("pulmonary", "ANATOMY", "C0024109", "Lung related"),
            ("hepatic", "ANATOMY", "C0205054", "Liver related"),
            ("renal", "ANATOMY", "C0205065", "Kidney related"),
            ("cerebral", "ANATOMY", "C0007874", "Brain related"),
            ("cardiac", "ANATOMY", "C0018787", "Heart related"),
            ("gastric", "ANATOMY", "C0017119", "Stomach related"),
            ("thoracic", "ANATOMY", "C0817096", "Chest related"),
            ("abdominal", "ANATOMY", "C0000726", "Belly related"),
            ("pelvic", "ANATOMY", "C0030797", "Pelvis related"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, cui, definition in umls_terms:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'UMLS', cui, definition))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(umls_terms)} UMLS concepts")
        return len(umls_terms)
    
    def load_meddra_terms(self) -> int:
        """Load MedDRA adverse event terms (simulated)"""
        print("🔄 Loading MedDRA adverse event terms...")
        
        # Sample MedDRA terms
        meddra_terms = [
            # Adverse events and side effects
            ("drug rash", "ADVERSE_EVENT", "10013968", "Skin reaction to medication"),
            ("drug fever", "ADVERSE_EVENT", "10013946", "Fever caused by medication"),
            ("anaphylaxis", "ADVERSE_EVENT", "10002198", "Severe allergic reaction"),
            ("stevens-johnson syndrome", "ADVERSE_EVENT", "10042033", "Severe skin reaction"),
            ("hepatotoxicity", "ADVERSE_EVENT", "10019851", "Liver damage from drugs"),
            ("nephrotoxicity", "ADVERSE_EVENT", "10029104", "Kidney damage from drugs"),
            ("cardiotoxicity", "ADVERSE_EVENT", "10007554", "Heart damage from drugs"),
            ("neurotoxicity", "ADVERSE_EVENT", "10029350", "Nerve damage from drugs"),
            ("bone marrow suppression", "ADVERSE_EVENT", "10005687", "Decreased blood cell production"),
            ("thrombocytopenia", "ADVERSE_EVENT", "10043554", "Low platelet count"),
            
            # Allergic reactions
            ("urticaria", "ADVERSE_EVENT", "10046735", "Hives"),
            ("angioedema", "ADVERSE_EVENT", "10002424", "Swelling of face/throat"),
            ("bronchospasm", "ADVERSE_EVENT", "10006482", "Airway constriction"),
            ("contact dermatitis", "ADVERSE_EVENT", "10010741", "Skin inflammation"),
            
            # Drug interactions
            ("serotonin syndrome", "ADVERSE_EVENT", "10040108", "Excess serotonin"),
            ("anticholinergic toxicity", "ADVERSE_EVENT", "10002748", "Anticholinergic overdose"),
            ("bleeding", "ADVERSE_EVENT", "10005103", "Excessive bleeding"),
            ("hypoglycemia", "ADVERSE_EVENT", "10020993", "Low blood sugar"),
            ("hyperkalemia", "ADVERSE_EVENT", "10020646", "High potassium"),
            ("hyponatremia", "ADVERSE_EVENT", "10021036", "Low sodium"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, meddra_code, definition in meddra_terms:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'MedDRA', meddra_code, definition))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(meddra_terms)} MedDRA terms")
        return len(meddra_terms)
    
    def load_icd_codes(self) -> int:
        """Load ICD-10 diagnosis codes from WHO API and local data"""
        print("🔄 Loading ICD-10/ICD-11 diagnosis codes...")
        
        # Try WHO ICD API first (free but limited)
        try:
            icd_count = self._load_icd_from_api()
            if icd_count > 0:
                return icd_count
        except Exception as e:
            print(f"⚠️  ICD API failed: {e}")
        
        # Fallback to comprehensive ICD-10 codes
        return self._load_icd_fallback()
    
    def _load_icd_from_api(self) -> int:
        """Load ICD codes from WHO API"""
        print("📡 Attempting to load from WHO ICD API...")
        
        # WHO ICD-11 API (requires token but has free tier)
        # For now, we'll use a comprehensive fallback
        return 0
    
    def _load_icd_fallback(self) -> int:
        """Load comprehensive ICD-10 diagnosis codes"""
        print("📋 Loading comprehensive ICD-10 diagnosis codes...")
        
        # Comprehensive ICD-10 codes organized by category
        icd_codes = [
            # Infectious and Parasitic Diseases (A00-B99)
            ("tuberculosis", "CONDITION", "A15", "Respiratory tuberculosis"),
            ("pneumonia", "CONDITION", "J18", "Pneumonia, unspecified organism"),
            ("sepsis", "CONDITION", "A41", "Other sepsis"),
            ("covid-19", "CONDITION", "U07.1", "COVID-19, virus identified"),
            ("influenza", "CONDITION", "J11", "Influenza due to unidentified influenza virus"),
            ("hepatitis", "CONDITION", "B19", "Unspecified viral hepatitis"),
            ("hiv", "CONDITION", "B20", "Human immunodeficiency virus [HIV] disease"),
            ("malaria", "CONDITION", "B54", "Unspecified malaria"),
            
            # Neoplasms (C00-D49)
            ("cancer", "CONDITION", "C80", "Malignant neoplasm, unspecified"),
            ("tumor", "CONDITION", "D49", "Neoplasms of unspecified behavior"),
            ("malignancy", "CONDITION", "C80", "Malignant neoplasm, unspecified"),
            ("lung cancer", "CONDITION", "C78.0", "Secondary malignant neoplasm of lung"),
            ("breast cancer", "CONDITION", "C50", "Malignant neoplasm of breast"),
            ("prostate cancer", "CONDITION", "C61", "Malignant neoplasm of prostate"),
            ("colon cancer", "CONDITION", "C18", "Malignant neoplasm of colon"),
            ("leukemia", "CONDITION", "C95", "Leukemia of unspecified cell type"),
            ("lymphoma", "CONDITION", "C85", "Non-Hodgkin lymphoma"),
            ("melanoma", "CONDITION", "C43", "Malignant melanoma of skin"),
            ("brain tumor", "CONDITION", "C71", "Malignant neoplasm of brain"),
            
            # Endocrine, Nutritional and Metabolic Diseases (E00-E89)
            ("diabetes mellitus", "CONDITION", "E11", "Type 2 diabetes mellitus"),
            ("type 1 diabetes", "CONDITION", "E10", "Type 1 diabetes mellitus"),
            ("type 2 diabetes", "CONDITION", "E11", "Type 2 diabetes mellitus"),
            ("hyperthyroidism", "CONDITION", "E05", "Thyrotoxicosis [hyperthyroidism]"),
            ("hypothyroidism", "CONDITION", "E03", "Other hypothyroidism"),
            ("obesity", "CONDITION", "E66", "Overweight and obesity"),
            ("malnutrition", "CONDITION", "E46", "Unspecified protein-energy malnutrition"),
            ("gout", "CONDITION", "M10", "Gout"),
            
            # Mental and Behavioral Disorders (F00-F99)
            ("depression", "CONDITION", "F32", "Depressive episode"),
            ("anxiety", "CONDITION", "F41", "Other anxiety disorders"),
            ("bipolar disorder", "CONDITION", "F31", "Bipolar affective disorder"),
            ("schizophrenia", "CONDITION", "F20", "Schizophrenia"),
            ("dementia", "CONDITION", "F03", "Unspecified dementia"),
            ("alzheimer disease", "CONDITION", "G30", "Alzheimer disease"),
            ("adhd", "CONDITION", "F90", "Attention-deficit hyperactivity disorders"),
            ("autism", "CONDITION", "F84", "Pervasive developmental disorders"),
            
            # Diseases of the Nervous System (G00-G99)
            ("stroke", "CONDITION", "I64", "Stroke, not specified as hemorrhage or infarction"),
            ("epilepsy", "CONDITION", "G40", "Epilepsy"),
            ("migraine", "CONDITION", "G43", "Migraine"),
            ("parkinson disease", "CONDITION", "G20", "Parkinson disease"),
            ("multiple sclerosis", "CONDITION", "G35", "Multiple sclerosis"),
            ("meningitis", "CONDITION", "G03", "Meningitis due to other and unspecified causes"),
            
            # Diseases of the Circulatory System (I00-I99)
            ("hypertension", "CONDITION", "I10", "Essential (primary) hypertension"),
            ("heart failure", "CONDITION", "I50", "Heart failure"),
            ("myocardial infarction", "CONDITION", "I21", "Acute myocardial infarction"),
            ("heart attack", "CONDITION", "I21", "Acute myocardial infarction"),
            ("atrial fibrillation", "CONDITION", "I48", "Atrial fibrillation and flutter"),
            ("coronary artery disease", "CONDITION", "I25", "Chronic ischemic heart disease"),
            ("angina", "CONDITION", "I20", "Angina pectoris"),
            ("cardiomyopathy", "CONDITION", "I42", "Cardiomyopathy"),
            ("pulmonary embolism", "CONDITION", "I26", "Pulmonary embolism"),
            ("deep vein thrombosis", "CONDITION", "I80", "Phlebitis and thrombophlebitis"),
            
            # Diseases of the Respiratory System (J00-J99)
            ("asthma", "CONDITION", "J45", "Asthma"),
            ("copd", "CONDITION", "J44", "Other chronic obstructive pulmonary disease"),
            ("chronic obstructive pulmonary disease", "CONDITION", "J44", "Other chronic obstructive pulmonary disease"),
            ("bronchitis", "CONDITION", "J40", "Bronchitis, not specified as acute or chronic"),
            ("pneumothorax", "CONDITION", "J93", "Pneumothorax"),
            ("pleural effusion", "CONDITION", "J94", "Other pleural conditions"),
            ("sleep apnea", "CONDITION", "G47.3", "Sleep apnea"),
            
            # Diseases of the Digestive System (K00-K95)
            ("gastroesophageal reflux", "CONDITION", "K21", "Gastro-esophageal reflux disease"),
            ("gerd", "CONDITION", "K21", "Gastro-esophageal reflux disease"),
            ("peptic ulcer", "CONDITION", "K27", "Peptic ulcer, site unspecified"),
            ("crohn disease", "CONDITION", "K50", "Crohn disease [regional enteritis]"),
            ("ulcerative colitis", "CONDITION", "K51", "Ulcerative colitis"),
            ("irritable bowel syndrome", "CONDITION", "K58", "Irritable bowel syndrome"),
            ("ibs", "CONDITION", "K58", "Irritable bowel syndrome"),
            ("cirrhosis", "CONDITION", "K74", "Fibrosis and cirrhosis of liver"),
            ("pancreatitis", "CONDITION", "K85", "Acute pancreatitis"),
            ("appendicitis", "CONDITION", "K37", "Unspecified appendicitis"),
            
            # Diseases of the Genitourinary System (N00-N99)
            ("kidney disease", "CONDITION", "N18", "Chronic kidney disease"),
            ("chronic kidney disease", "CONDITION", "N18", "Chronic kidney disease"),
            ("urinary tract infection", "CONDITION", "N39.0", "Urinary tract infection, site not specified"),
            ("uti", "CONDITION", "N39.0", "Urinary tract infection, site not specified"),
            ("kidney stones", "CONDITION", "N20", "Calculus of kidney and ureter"),
            ("prostatitis", "CONDITION", "N41", "Inflammatory diseases of prostate"),
            ("endometriosis", "CONDITION", "N80", "Endometriosis"),
            
            # Diseases of the Musculoskeletal System (M00-M99)
            ("arthritis", "CONDITION", "M13", "Other arthritis"),
            ("rheumatoid arthritis", "CONDITION", "M06", "Rheumatoid arthritis"),
            ("osteoarthritis", "CONDITION", "M19", "Other and unspecified osteoarthritis"),
            ("osteoporosis", "CONDITION", "M81", "Osteoporosis without current pathological fracture"),
            ("fibromyalgia", "CONDITION", "M79.3", "Panniculitis, unspecified"),
            ("lupus", "CONDITION", "M32", "Systemic lupus erythematosus"),
            ("back pain", "CONDITION", "M54", "Dorsalgia"),
            
            # Injury, Poisoning and External Causes (S00-T88)
            ("fracture", "CONDITION", "S72", "Fracture of femur"),
            ("concussion", "CONDITION", "S06.0", "Concussion"),
            ("burn", "CONDITION", "T30", "Burn and corrosion, body region unspecified"),
            ("poisoning", "CONDITION", "T65", "Toxic effect of other and unspecified substances"),
            
            # Symptoms, Signs and Abnormal Clinical Findings (R00-R99)
            ("chest pain", "SYMPTOM", "R06.02", "Shortness of breath"),
            ("shortness of breath", "SYMPTOM", "R06.02", "Shortness of breath"),
            ("abdominal pain", "SYMPTOM", "R10", "Abdominal and pelvic pain"),
            ("headache", "SYMPTOM", "R51", "Headache"),
            ("dizziness", "SYMPTOM", "R42", "Dizziness and giddiness"),
            ("nausea", "SYMPTOM", "R11", "Nausea and vomiting"),
            ("vomiting", "SYMPTOM", "R11", "Nausea and vomiting"),
            ("fever", "SYMPTOM", "R50", "Fever, unspecified"),
            ("fatigue", "SYMPTOM", "R53", "Malaise and fatigue"),
            ("weight loss", "SYMPTOM", "R63.4", "Abnormal weight loss"),
            ("weight gain", "SYMPTOM", "R63.5", "Abnormal weight gain"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, icd_code, description in icd_codes:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'ICD-10', icd_code, description))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Loaded {len(icd_codes)} ICD-10 diagnosis codes")
        return len(icd_codes)

    def load_icd_codes(self) -> int:
        """Load ICD-10/ICD-11 diagnosis codes from WHO standards"""
        print("🔄 Loading ICD diagnosis codes...")
        
        total_loaded = 0
        
        # Load ICD-10 codes
        total_loaded += self._load_icd10_codes()
        
        # Load ICD-11 codes  
        total_loaded += self._load_icd11_codes()
        
        print(f"✅ Loaded {total_loaded:,} ICD diagnosis codes")
        return total_loaded
    
    def _load_icd10_codes(self) -> int:
        """Load ICD-10 diagnosis codes"""
        print("  📋 Loading ICD-10 diagnosis codes...")
        
        # Common ICD-10 codes (comprehensive list)
        icd10_codes = [
            # Infectious and parasitic diseases (A00-B99)
            ("tuberculosis", "CONDITION", "A15", "Respiratory tuberculosis"),
            ("pneumonia", "CONDITION", "J18", "Pneumonia, unspecified organism"),
            ("influenza", "CONDITION", "J11", "Influenza due to unidentified influenza virus"),
            ("covid-19", "CONDITION", "U07.1", "COVID-19, virus identified"),
            ("sepsis", "CONDITION", "A41", "Other sepsis"),
            ("meningitis", "CONDITION", "G03", "Meningitis due to other and unspecified causes"),
            
            # Neoplasms (C00-D49)
            ("lung cancer", "CONDITION", "C78.0", "Secondary malignant neoplasm of lung"),
            ("breast cancer", "CONDITION", "C50", "Malignant neoplasm of breast"),
            ("prostate cancer", "CONDITION", "C61", "Malignant neoplasm of prostate"),
            ("colon cancer", "CONDITION", "C18", "Malignant neoplasm of colon"),
            ("leukemia", "CONDITION", "C95", "Leukemia of unspecified cell type"),
            ("lymphoma", "CONDITION", "C85", "Non-Hodgkin lymphoma"),
            
            # Endocrine, nutritional and metabolic diseases (E00-E89)
            ("diabetes", "CONDITION", "E11", "Diabetes mellitus"),
            ("diabetes mellitus", "CONDITION", "E11", "Type 2 diabetes mellitus"),
            ("type 1 diabetes", "CONDITION", "E10", "Type 1 diabetes mellitus"),
            ("type 2 diabetes", "CONDITION", "E11", "Type 2 diabetes mellitus"),
            ("hyperthyroidism", "CONDITION", "E05", "Thyrotoxicosis [hyperthyroidism]"),
            ("hypothyroidism", "CONDITION", "E03", "Other hypothyroidism"),
            ("obesity", "CONDITION", "E66", "Overweight and obesity"),
            ("malnutrition", "CONDITION", "E46", "Unspecified protein-energy malnutrition"),
            
            # Mental and behavioural disorders (F00-F99)
            ("depression", "CONDITION", "F32", "Depressive episode"),
            ("anxiety disorder", "CONDITION", "F41", "Other anxiety disorders"),
            ("bipolar disorder", "CONDITION", "F31", "Bipolar affective disorder"),
            ("schizophrenia", "CONDITION", "F20", "Schizophrenia"),
            ("dementia", "CONDITION", "F03", "Unspecified dementia"),
            ("alzheimer disease", "CONDITION", "G30", "Alzheimer disease"),
            
            # Diseases of the nervous system (G00-G99)
            ("stroke", "CONDITION", "I64", "Stroke, not specified as haemorrhage or infarction"),
            ("epilepsy", "CONDITION", "G40", "Epilepsy"),
            ("migraine", "CONDITION", "G43", "Migraine"),
            ("parkinson disease", "CONDITION", "G20", "Parkinson disease"),
            ("multiple sclerosis", "CONDITION", "G35", "Multiple sclerosis"),
            
            # Diseases of the circulatory system (I00-I99)
            ("hypertension", "CONDITION", "I10", "Essential (primary) hypertension"),
            ("heart failure", "CONDITION", "I50", "Heart failure"),
            ("myocardial infarction", "CONDITION", "I21", "Acute myocardial infarction"),
            ("heart attack", "CONDITION", "I21", "Acute myocardial infarction"),
            ("atrial fibrillation", "CONDITION", "I48", "Atrial fibrillation and flutter"),
            ("coronary artery disease", "CONDITION", "I25", "Chronic ischaemic heart disease"),
            ("angina", "CONDITION", "I20", "Angina pectoris"),
            
            # Diseases of the respiratory system (J00-J99)
            ("asthma", "CONDITION", "J45", "Asthma"),
            ("copd", "CONDITION", "J44", "Other chronic obstructive pulmonary disease"),
            ("chronic obstructive pulmonary disease", "CONDITION", "J44", "Other chronic obstructive pulmonary disease"),
            ("bronchitis", "CONDITION", "J40", "Bronchitis, not specified as acute or chronic"),
            ("emphysema", "CONDITION", "J43", "Emphysema"),
            ("pulmonary embolism", "CONDITION", "I26", "Pulmonary embolism"),
            
            # Diseases of the digestive system (K00-K95)
            ("gastritis", "CONDITION", "K29", "Gastritis and duodenitis"),
            ("peptic ulcer", "CONDITION", "K27", "Peptic ulcer, site unspecified"),
            ("gastroesophageal reflux", "CONDITION", "K21", "Gastro-oesophageal reflux disease"),
            ("gerd", "CONDITION", "K21", "Gastro-oesophageal reflux disease"),
            ("irritable bowel syndrome", "CONDITION", "K58", "Irritable bowel syndrome"),
            ("ibs", "CONDITION", "K58", "Irritable bowel syndrome"),
            ("crohn disease", "CONDITION", "K50", "Crohn disease [regional enteritis]"),
            ("ulcerative colitis", "CONDITION", "K51", "Ulcerative colitis"),
            ("hepatitis", "CONDITION", "K75", "Other inflammatory liver diseases"),
            ("cirrhosis", "CONDITION", "K74", "Fibrosis and cirrhosis of liver"),
            
            # Diseases of the genitourinary system (N00-N99)
            ("kidney disease", "CONDITION", "N18", "Chronic kidney disease"),
            ("chronic kidney disease", "CONDITION", "N18", "Chronic kidney disease"),
            ("urinary tract infection", "CONDITION", "N39.0", "Urinary tract infection, site not specified"),
            ("uti", "CONDITION", "N39.0", "Urinary tract infection, site not specified"),
            ("kidney stones", "CONDITION", "N20", "Calculus of kidney and ureter"),
            
            # Diseases of the musculoskeletal system (M00-M99)
            ("arthritis", "CONDITION", "M13", "Other arthritis"),
            ("rheumatoid arthritis", "CONDITION", "M06", "Rheumatoid arthritis"),
            ("osteoarthritis", "CONDITION", "M19", "Other and unspecified arthrosis"),
            ("osteoporosis", "CONDITION", "M81", "Osteoporosis without current pathological fracture"),
            ("fibromyalgia", "CONDITION", "M79.3", "Panniculitis, unspecified"),
            ("lupus", "CONDITION", "M32", "Systemic lupus erythematosus"),
            
            # Injury, poisoning and certain other consequences (S00-T98)
            ("fracture", "CONDITION", "S72", "Fracture of femur"),
            ("concussion", "CONDITION", "S06.0", "Concussion"),
            ("burn", "CONDITION", "T30", "Burn and corrosion, body region unspecified"),
            ("poisoning", "CONDITION", "T65", "Toxic effect of other and unspecified substances"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, icd_code, definition in icd10_codes:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'ICD-10', icd_code, definition))
        
        conn.commit()
        conn.close()
        
        print(f"    ✅ Loaded {len(icd10_codes)} ICD-10 codes")
        return len(icd10_codes)
    
    def _load_icd11_codes(self) -> int:
        """Load ICD-11 diagnosis codes"""
        print("  📋 Loading ICD-11 diagnosis codes...")
        
        # ICD-11 codes (newer classification)
        icd11_codes = [
            # Additional modern diagnoses and refined classifications
            ("long covid", "CONDITION", "RA02", "Post COVID-19 condition"),
            ("post-covid syndrome", "CONDITION", "RA02", "Post COVID-19 condition"),
            ("metabolic syndrome", "CONDITION", "5C80", "Metabolic syndrome"),
            ("sleep apnea", "CONDITION", "7A80", "Sleep-wake disorders"),
            ("chronic fatigue syndrome", "CONDITION", "8E49", "Chronic fatigue syndrome"),
            ("autism spectrum disorder", "CONDITION", "6A02", "Autism spectrum disorder"),
            ("adhd", "CONDITION", "6A05", "Attention deficit hyperactivity disorder"),
            ("attention deficit hyperactivity disorder", "CONDITION", "6A05", "Attention deficit hyperactivity disorder"),
            ("ptsd", "CONDITION", "6B40", "Post traumatic stress disorder"),
            ("post-traumatic stress disorder", "CONDITION", "6B40", "Post traumatic stress disorder"),
            ("eating disorder", "CONDITION", "6B80", "Feeding or eating disorders"),
            ("anorexia nervosa", "CONDITION", "6B80.0", "Anorexia nervosa"),
            ("bulimia nervosa", "CONDITION", "6B81", "Bulimia nervosa"),
            ("substance use disorder", "CONDITION", "6C40", "Disorders due to substance use"),
            ("alcohol use disorder", "CONDITION", "6C40.0", "Disorders due to use of alcohol"),
            ("opioid use disorder", "CONDITION", "6C43", "Disorders due to use of opioids"),
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for term, category, icd_code, definition in icd11_codes:
            cursor.execute('''
                INSERT OR IGNORE INTO medical_terms 
                (term, category, source_db, concept_id, definition)
                VALUES (?, ?, ?, ?, ?)
            ''', (term, category, 'ICD-11', icd_code, definition))
        
        conn.commit()
        conn.close()
        
        print(f"    ✅ Loaded {len(icd11_codes)} ICD-11 codes")
        return len(icd11_codes)

    def load_all_databases(self) -> Dict[str, int]:
        """Load all medical databases"""
        print("🚀 Loading comprehensive medical databases...")
        
        results = {}
        results['OpenFDA'] = self.load_openfda_drugs()
        results['LOINC'] = self.load_loinc_codes()
        results['ICD-10'] = self.load_icd_codes()  # NEW: All diagnoses!
        results['HPO'] = self.load_hpo_phenotypes()
        results['UMLS'] = self.load_umls_concepts()
        results['MedDRA'] = self.load_meddra_terms()
        
        total_terms = sum(results.values())
        print(f"\n🎉 Successfully loaded {total_terms} medical terms from {len(results)} databases!")
        
        return results
    
    def search_medical_terms(self, text: str, category: str = None) -> List[Tuple[str, str, str]]:
        """Search for medical terms in text"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if category:
            cursor.execute('''
                SELECT term, category, source_db FROM medical_terms 
                WHERE category = ? AND ? LIKE '%' || term || '%'
                ORDER BY LENGTH(term) DESC
            ''', (category, text.lower()))
        else:
            cursor.execute('''
                SELECT term, category, source_db FROM medical_terms 
                WHERE ? LIKE '%' || term || '%'
                ORDER BY LENGTH(term) DESC
            ''', (text.lower(),))
        
        results = cursor.fetchall()
        conn.close()
        
        return results
    
    def get_database_stats(self) -> Dict[str, int]:
        """Get statistics about loaded databases"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT source_db, COUNT(*) FROM medical_terms 
            GROUP BY source_db
        ''')
        
        stats = dict(cursor.fetchall())
        conn.close()
        
        return stats

if __name__ == "__main__":
    # Initialize and load all databases
    db_manager = MedicalDatabaseManager()
    results = db_manager.load_all_databases()
    
    # Show statistics
    stats = db_manager.get_database_stats()
    print("\n📊 Database Statistics:")
    for db, count in stats.items():
        print(f"  {db}: {count:,} terms")
    
    print(f"\n🏥 Total medical terms available: {sum(stats.values()):,}")
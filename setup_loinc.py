"""
LOINC Database Setup Helper
This script helps you integrate the LOINC database with X-NOSIS
"""

import os
import sys
import shutil
from pathlib import Path

def find_loinc_files():
    """Find LOINC files in common locations"""
    print("🔍 Searching for LOINC files...")
    
    # Common LOINC file names
    loinc_files = ['Loinc.csv', 'loinc.csv', 'LOINC.csv']
    
    # Search locations
    search_paths = [
        '.',
        './loinc',
        './data',
        './backend',
        '../',
        '~/Downloads',
        '~/Desktop',
        'C:/Users/*/Downloads',
        'C:/Users/*/Desktop'
    ]
    
    found_files = []
    
    for search_path in search_paths:
        try:
            path = Path(search_path).expanduser()
            if path.exists():
                for loinc_file in loinc_files:
                    file_path = path / loinc_file
                    if file_path.exists():
                        found_files.append(str(file_path))
                        print(f"✅ Found LOINC file: {file_path}")
                
                # Also search in subdirectories
                for subdir in path.iterdir():
                    if subdir.is_dir():
                        for loinc_file in loinc_files:
                            file_path = subdir / loinc_file
                            if file_path.exists():
                                found_files.append(str(file_path))
                                print(f"✅ Found LOINC file: {file_path}")
        except:
            continue
    
    return found_files

def setup_loinc_directory():
    """Create LOINC directory structure"""
    loinc_dir = Path('./backend/loinc')
    loinc_dir.mkdir(exist_ok=True)
    print(f"📁 Created LOINC directory: {loinc_dir}")
    return loinc_dir

def copy_loinc_file(source_path: str, dest_dir: Path):
    """Copy LOINC file to the backend directory"""
    source = Path(source_path)
    dest = dest_dir / 'Loinc.csv'
    
    try:
        shutil.copy2(source, dest)
        print(f"✅ Copied LOINC file to: {dest}")
        return str(dest)
    except Exception as e:
        print(f"❌ Error copying file: {e}")
        return None

def test_loinc_integration(loinc_file_path: str):
    """Test the LOINC integration"""
    print("🧪 Testing LOINC integration...")
    
    try:
        sys.path.append('./backend')
        from medical_databases import MedicalDatabaseManager
        
        # Initialize database manager
        db_manager = MedicalDatabaseManager()
        
        # Load LOINC codes
        count = db_manager.load_loinc_codes(loinc_file_path)
        
        if count > 0:
            print(f"🎉 Successfully loaded {count:,} LOINC codes!")
            
            # Test search functionality
            test_terms = ["glucose", "cholesterol", "hemoglobin", "blood pressure"]
            print("\n🔍 Testing search functionality:")
            
            for term in test_terms:
                results = db_manager.search_medical_terms(f"patient has {term}", "LAB_VALUES")
                if results:
                    print(f"  ✅ Found {len(results)} matches for '{term}'")
                else:
                    print(f"  ❌ No matches for '{term}'")
            
            return True
        else:
            print("❌ Failed to load LOINC codes")
            return False
            
    except Exception as e:
        print(f"❌ Error testing LOINC integration: {e}")
        return False

def main():
    print("🏥 X-NOSIS LOINC Database Setup")
    print("=" * 40)
    
    # Step 1: Find LOINC files
    found_files = find_loinc_files()
    
    if not found_files:
        print("\n❌ No LOINC files found!")
        print("\n📋 To download LOINC database:")
        print("1. Go to: https://loinc.org/downloads/")
        print("2. Register for free account")
        print("3. Download 'LOINC Table File'")
        print("4. Extract the zip file")
        print("5. Run this script again")
        return
    
    # Step 2: Setup directory
    loinc_dir = setup_loinc_directory()
    
    # Step 3: Copy the first found file
    loinc_file_path = copy_loinc_file(found_files[0], loinc_dir)
    
    if not loinc_file_path:
        print("❌ Failed to copy LOINC file")
        return
    
    # Step 4: Test integration
    success = test_loinc_integration(loinc_file_path)
    
    if success:
        print("\n🎉 LOINC integration completed successfully!")
        print(f"📁 LOINC file location: {loinc_file_path}")
        print("\n🚀 Your NER system now has access to 95,000+ lab codes!")
    else:
        print("\n❌ LOINC integration failed")

if __name__ == "__main__":
    main()
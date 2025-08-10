import os
import glob

print("🔍 Searching for LOINC files and folders...")

# Search for folders with 'loinc' in the name
print("\n📁 Folders containing 'loinc':")
for root, dirs, files in os.walk('.'):
    for dir_name in dirs:
        if 'loinc' in dir_name.lower():
            full_path = os.path.join(root, dir_name)
            print(f"  Found folder: {full_path}")
            
            # List contents of LOINC folders
            try:
                contents = os.listdir(full_path)
                print(f"    Contents: {contents[:10]}...")  # Show first 10 items
            except:
                pass

# Search for CSV files that might be LOINC
print("\n📄 CSV files that might be LOINC:")
for root, dirs, files in os.walk('.'):
    for file_name in files:
        if file_name.lower().endswith('.csv') and ('loinc' in file_name.lower() or 'Loinc' in file_name):
            full_path = os.path.join(root, file_name)
            file_size = os.path.getsize(full_path)
            print(f"  Found CSV: {full_path} ({file_size:,} bytes)")

print("\n🔍 Also searching for any large CSV files (might be LOINC):")
for root, dirs, files in os.walk('.'):
    for file_name in files:
        if file_name.lower().endswith('.csv'):
            full_path = os.path.join(root, file_name)
            try:
                file_size = os.path.getsize(full_path)
                if file_size > 1000000:  # Files larger than 1MB
                    print(f"  Large CSV: {full_path} ({file_size:,} bytes)")
            except:
                pass
# Design Document

## Overview

This design document outlines the implementation of a comprehensive Patient Health Management System for X-NOSIS. The system will provide a hierarchical file organization structure similar to a modern file explorer, integrated with AI-powered medical document analysis. The design maintains consistency with the existing X-NOSIS bubblegum theme while introducing new components for patient management.

## Architecture

### System Architecture
The Patient Management System follows a hierarchical data structure with integrated AI analysis:

```
Patient Management System
├── Patient Directory
│   ├── Patient Info (Name, ID, Demographics)
│   ├── Folder Categories
│   │   ├── Imaging
│   │   │   ├── X-rays
│   │   │   ├── MRI Scans
│   │   │   └── CT Scans
│   │   ├── Test Reports
│   │   │   ├── Blood Tests
│   │   │   ├── Pathology
│   │   │   └── Cardiology
│   │   ├── Follow-ups
│   │   │   ├── Consultation Notes
│   │   │   └── Progress Reports
│   │   └── Add-on Notes
│   │       ├── Prescriptions
│   │       └── Discharge Summaries
│   └── Timeline View
└── Search & Filter System
```

### Database Schema
```sql
-- Patients table
CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient folders table
CREATE TABLE patient_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    folder_name TEXT NOT NULL,
    folder_type TEXT, -- 'imaging', 'test_reports', 'follow_ups', 'notes', 'custom'
    parent_folder_id INTEGER REFERENCES patient_folders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient documents table
CREATE TABLE patient_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    folder_id INTEGER REFERENCES patient_folders(id),
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    analysis_id INTEGER REFERENCES analysis_results(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_date DATE -- Actual date of the medical document
);
```

## Components and Interfaces

### Patient Directory Component
```typescript
interface Patient {
  id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  contactInfo: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientFolder {
  id: string;
  patientId: string;
  folderName: string;
  folderType: 'imaging' | 'test_reports' | 'follow_ups' | 'notes' | 'custom';
  parentFolderId?: string;
  createdAt: string;
  documentCount: number;
  subFolders: PatientFolder[];
}

interface PatientDocument {
  id: string;
  patientId: string;
  folderId: string;
  documentName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  analysisId?: string;
  uploadDate: string;
  documentDate: string;
  analysisResults?: MedicalAnalysisResult;
}
```

### UI Component Structure
```typescript
// Main patient management page
<PatientManagementPage>
  <PatientSidebar />
  <PatientMainContent>
    <PatientHeader />
    <PatientBreadcrumb />
    <PatientFolderView />
    <PatientTimelineView />
  </PatientMainContent>
</PatientManagementPage>

// Patient folder view component
<PatientFolderView>
  <FolderGrid>
    <FolderCard type="imaging" />
    <FolderCard type="test_reports" />
    <FolderCard type="follow_ups" />
    <FolderCard type="notes" />
    <CreateFolderCard />
  </FolderGrid>
  <DocumentList>
    <DocumentCard />
    <UploadZone />
  </DocumentList>
</PatientFolderView>
```

## Data Models

### Patient Management Models
```typescript
interface PatientManagementState {
  patients: Patient[];
  currentPatient: Patient | null;
  currentFolder: PatientFolder | null;
  folderHierarchy: PatientFolder[];
  documents: PatientDocument[];
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'timeline';
  loading: boolean;
}

interface FolderTemplate {
  name: string;
  type: string;
  icon: string;
  color: string;
  description: string;
  defaultSubFolders?: string[];
}

const DEFAULT_FOLDER_TEMPLATES: FolderTemplate[] = [
  {
    name: "Imaging",
    type: "imaging",
    icon: "🏥",
    color: "blue",
    description: "X-rays, MRI, CT scans, and other medical imaging",
    defaultSubFolders: ["X-rays", "MRI Scans", "CT Scans", "Ultrasounds"]
  },
  {
    name: "Test Reports",
    type: "test_reports", 
    icon: "🧪",
    color: "green",
    description: "Lab results, blood tests, pathology reports",
    defaultSubFolders: ["Blood Tests", "Pathology", "Cardiology", "Radiology Reports"]
  },
  {
    name: "Follow-ups",
    type: "follow_ups",
    icon: "📋",
    color: "orange", 
    description: "Consultation notes, progress reports, check-ups",
    defaultSubFolders: ["Consultation Notes", "Progress Reports", "Specialist Visits"]
  },
  {
    name: "Add-on Notes",
    type: "notes",
    icon: "📝",
    color: "purple",
    description: "Prescriptions, discharge summaries, additional notes",
    defaultSubFolders: ["Prescriptions", "Discharge Summaries", "Clinical Notes"]
  }
];
```

## User Interface Design

### Theme Integration
The patient management system will use the existing X-NOSIS bubblegum theme:

```css
/* Patient management specific styles */
.patient-card {
  @apply bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300;
}

.folder-card {
  @apply bg-card text-card-foreground border-2 border-border rounded-xl shadow-bubblegum hover:shadow-bubblegum-lg transform hover:-translate-y-1 transition-all duration-300;
}

.document-item {
  @apply bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200;
}

.upload-zone {
  @apply border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300;
}
```

### Navigation Structure
```
/patients                    - Patient list view
/patients/new               - Create new patient
/patients/:id               - Patient overview
/patients/:id/folder/:folderId - Folder view
/patients/:id/timeline      - Patient timeline
/patients/:id/search        - Search within patient
```

### Responsive Design
- **Desktop**: Full sidebar with patient list, main content area with folder grid
- **Tablet**: Collapsible sidebar, responsive folder grid (2-3 columns)
- **Mobile**: Bottom navigation, single column layout, swipe gestures

## API Endpoints

### Patient Management API
```python
# Patient CRUD operations
POST   /api/patients                    # Create new patient
GET    /api/patients                    # List all patients
GET    /api/patients/{patient_id}       # Get patient details
PUT    /api/patients/{patient_id}       # Update patient
DELETE /api/patients/{patient_id}       # Delete patient

# Folder management
POST   /api/patients/{patient_id}/folders           # Create folder
GET    /api/patients/{patient_id}/folders           # List folders
GET    /api/patients/{patient_id}/folders/{folder_id} # Get folder contents
PUT    /api/patients/{patient_id}/folders/{folder_id} # Update folder
DELETE /api/patients/{patient_id}/folders/{folder_id} # Delete folder

# Document management
POST   /api/patients/{patient_id}/documents         # Upload document
GET    /api/patients/{patient_id}/documents         # List documents
GET    /api/patients/{patient_id}/documents/{doc_id} # Get document
DELETE /api/patients/{patient_id}/documents/{doc_id} # Delete document

# Search and timeline
GET    /api/patients/{patient_id}/search?q={query}  # Search patient data
GET    /api/patients/{patient_id}/timeline          # Get patient timeline
```

## Error Handling

### Patient Management Errors
- **Patient Not Found**: Clear error message with option to create new patient
- **Folder Access Denied**: Proper permission handling with user feedback
- **Document Upload Failures**: Retry mechanism with progress indication
- **Storage Limits**: Clear warnings about storage usage and limits

### Data Validation
- **Patient Information**: Required fields validation with helpful error messages
- **File Uploads**: File type, size, and content validation
- **Folder Names**: Duplicate name prevention and character restrictions
- **Document Dates**: Date format validation and logical date checking

## Security Considerations

### Access Control
- **Patient Privacy**: Each patient directory is isolated and access-controlled
- **Document Security**: Encrypted storage for sensitive medical documents
- **User Permissions**: Role-based access control for different user types
- **Audit Logging**: Complete audit trail of all patient data access and modifications

### Data Protection
- **HIPAA Compliance**: Ensure all patient data handling meets HIPAA requirements
- **Data Encryption**: Encrypt sensitive patient information at rest and in transit
- **Backup Strategy**: Regular automated backups with secure storage
- **Data Retention**: Configurable data retention policies

## Performance Optimization

### Frontend Performance
- **Lazy Loading**: Load patient data and documents on demand
- **Virtual Scrolling**: Handle large patient lists efficiently
- **Image Optimization**: Compress and optimize medical images for web display
- **Caching Strategy**: Cache frequently accessed patient data

### Backend Performance
- **Database Indexing**: Proper indexing on patient_id, folder_id, and search fields
- **File Storage**: Efficient file storage with CDN integration
- **API Pagination**: Paginate large result sets for better performance
- **Background Processing**: Process AI analysis in background for large documents

## Implementation Phases

### Phase 1: Core Patient Management (Days 1-2)
- Patient CRUD operations
- Basic folder structure
- Simple document upload
- Theme integration

### Phase 2: Advanced Organization (Days 3-4)
- Sub-folder creation
- Drag and drop functionality
- Document categorization
- Search functionality

### Phase 3: Timeline and Analytics (Days 5-6)
- Patient timeline view
- Document analysis integration
- Advanced search and filtering
- Performance optimization

This design provides a comprehensive foundation for building a professional patient health management system that integrates seamlessly with the existing X-NOSIS platform while maintaining the bubblegum theme aesthetic.
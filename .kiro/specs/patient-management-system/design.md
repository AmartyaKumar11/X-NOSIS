# Design Document

## Overview

This design document outlines the implementation of a comprehensive Patient Health Management System for X-NOSIS. The system will provide healthcare professionals with an intuitive, organized way to manage patient records through a hierarchical directory structure with integrated AI-powered document analysis. The design emphasizes consistency with the existing X-NOSIS interface while introducing powerful patient-centric organization capabilities.

## Architecture

### System Architecture
The Patient Management System integrates seamlessly with the existing X-NOSIS architecture:

```
Frontend (Next.js)
├── Patient List View
├── Patient Directory View  
├── Document Upload & Analysis
└── Navigation & Search

Backend (FastAPI)
├── Patient Management API
├── Directory Structure API
├── Document Analysis Integration
└── Search & Filter API

Database (SQLite)
├── Patients Table
├── Directories Table
├── Documents Table
└── Analysis Results Table
```

### Navigation Structure
```
Dashboard → Patients → [Patient Name] → [Category] → [Subdirectory] → Documents
```

### URL Structure
```
/patients                           # Patient list
/patients/[patientId]              # Patient overview
/patients/[patientId]/[category]   # Category view
/patients/[patientId]/[category]/[subdirectory] # Subdirectory view
```

## Components and Interfaces

### Patient List Interface
```typescript
interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  createdAt: Date;
  updatedAt: Date;
  documentCount: number;
  lastActivity: Date;
  avatar?: string;
}

interface PatientListProps {
  patients: Patient[];
  onCreatePatient: () => void;
  onSelectPatient: (patientId: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}
```

### Directory Structure Interface
```typescript
interface Directory {
  id: string;
  name: string;
  type: 'default' | 'custom';
  parentId?: string;
  patientId: string;
  documentCount: number;
  createdAt: Date;
  icon?: string;
  color?: string;
}

interface DirectoryTreeProps {
  directories: Directory[];
  currentPath: string[];
  onNavigate: (path: string[]) => void;
  onCreateDirectory: (parentId?: string) => void;
  onRenameDirectory: (id: string, newName: string) => void;
  onDeleteDirectory: (id: string) => void;
}
```

### Document Management Interface
```typescript
interface PatientDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  directoryId: string;
  patientId: string;
  uploadedAt: Date;
  analysisId?: string;
  analysisStatus: 'pending' | 'completed' | 'failed';
  tags: string[];
}

interface DocumentGridProps {
  documents: PatientDocument[];
  onUpload: (files: File[]) => void;
  onAnalyze: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  onViewAnalysis: (analysisId: string) => void;
}
```

## Data Models

### Database Schema

#### Patients Table
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON for additional patient info
);
```

#### Directories Table
```sql
CREATE TABLE directories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('default', 'custom')) DEFAULT 'custom',
  parent_id TEXT REFERENCES directories(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER DEFAULT 0
);
```

#### Patient Documents Table
```sql
CREATE TABLE patient_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  directory_id TEXT NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES analysis_results(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT -- JSON array of tags
);
```

### Default Directory Structure
```typescript
const DEFAULT_DIRECTORIES = [
  {
    name: "Imaging",
    icon: "Camera",
    color: "blue",
    suggestions: ["X-Ray", "MRI", "CT Scan", "Ultrasound", "ECG", "Mammography"]
  },
  {
    name: "Lab Reports", 
    icon: "TestTube",
    color: "green",
    suggestions: ["Blood Work", "Urine Analysis", "Lipid Profile", "CBC", "Liver Function", "Kidney Function", "Thyroid Panel"]
  },
  {
    name: "Follow-ups",
    icon: "Calendar",
    color: "orange", 
    suggestions: ["Progress Notes", "Treatment Updates", "Medication Reviews", "Appointment Notes"]
  },
  {
    name: "Clinical Notes",
    icon: "FileText",
    color: "purple",
    suggestions: ["Consultation Notes", "Discharge Summaries", "Referral Letters", "Treatment Plans"]
  }
];
```

## User Interface Design

### Patient List Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Patients                                    [+] │
│           │                                                 │
│           │ [Search patients...]                           │
│           │                                                 │
│           │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│           │ │ John Doe    │ │ Jane Smith  │ │ Bob Johnson │ │
│           │ │ 📊 24 docs  │ │ 📊 18 docs  │ │ 📊 31 docs  │ │
│           │ │ 🕒 2h ago   │ │ 🕒 1d ago   │ │ 🕒 3d ago   │ │
│           │ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Patient Directory View
```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Patients > John Doe                        [⚙] │
│           │                                                 │
│           │ [🔍 Search in John's records...]               │
│           │                                                 │
│           │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│           │ │ 📷 Imaging  │ │ 🧪 Lab      │ │ 📋 Follow   │ │
│           │ │ 12 files    │ │ Reports     │ │ ups         │ │
│           │ │             │ │ 8 files     │ │ 4 files     │ │
│           │ └─────────────┘ └─────────────┘ └─────────────┘ │
│           │                                                 │
│           │ ┌─────────────┐ ┌─────────────┐ [+ Custom Dir] │
│           │ │ 📝 Clinical │ │ 🩺 Cardio   │                │
│           │ │ Notes       │ │ logy        │                │
│           │ │ 6 files     │ │ 3 files     │                │
│           │ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Document View with Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar] │ John Doe > Lab Reports > Blood Work        [↑] │
│           │                                                 │
│           │ ┌─────────────────────────────────────────────┐ │
│           │ │ 📄 CBC_Report_2025.pdf        [Analyze]    │ │
│           │ │ ✅ Analysis Complete - 94% confidence      │ │
│           │ │ 🏷️ 12 entities found                       │ │
│           │ │ 🩺 2 differential diagnoses                 │ │
│           │ └─────────────────────────────────────────────┘ │
│           │                                                 │
│           │ [Drag & drop files here or click to upload]    │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

### Patient Management Errors
- **Duplicate Patient Names**: Allow duplicates but show creation date for disambiguation
- **Directory Deletion**: Prevent deletion of directories containing documents without confirmation
- **File Upload Failures**: Show clear error messages and retry options
- **Analysis Failures**: Display analysis status and allow re-analysis

### Data Integrity
- **Cascade Deletions**: Properly handle patient deletion with all associated data
- **Orphaned Documents**: Prevent documents from losing their directory association
- **Concurrent Access**: Handle multiple users accessing the same patient records

## Testing Strategy

### Unit Testing
- **Patient CRUD Operations**: Test creation, reading, updating, and deletion of patients
- **Directory Management**: Test directory creation, nesting, and organization
- **Document Upload**: Test file upload, validation, and storage
- **Search Functionality**: Test patient and document search capabilities

### Integration Testing
- **AI Analysis Integration**: Test document analysis workflow within patient context
- **Navigation Flow**: Test complete user journey from patient list to document analysis
- **Data Consistency**: Test data integrity across patient, directory, and document relationships

### User Experience Testing
- **Responsive Design**: Test on various screen sizes and devices
- **Performance**: Test with large numbers of patients and documents
- **Accessibility**: Ensure keyboard navigation and screen reader compatibility

## Implementation Plan

### Phase 1: Core Patient Management (Days 1-2)
1. **Database Schema Setup**
   - Create patient, directory, and document tables
   - Set up proper relationships and constraints
   - Add indexes for performance

2. **Basic Patient CRUD**
   - Create patient list page
   - Implement patient creation, editing, and deletion
   - Add basic search functionality

### Phase 2: Directory Structure (Days 3-4)
1. **Directory Management**
   - Implement hierarchical directory creation
   - Add default directory initialization
   - Create directory navigation interface

2. **Custom Directory Features**
   - Add custom directory creation with suggestions
   - Implement directory renaming and deletion
   - Create nested directory support

### Phase 3: Document Integration (Days 5-6)
1. **Document Upload in Context**
   - Integrate existing upload functionality with patient directories
   - Add document organization within directories
   - Implement document tagging and metadata

2. **Analysis Integration**
   - Connect existing AI analysis with patient context
   - Store analysis results linked to patient records
   - Create patient-specific analysis history

### Phase 4: Search and Navigation (Days 7-8)
1. **Advanced Search**
   - Implement patient search with filters
   - Add document search within patient records
   - Create breadcrumb navigation

2. **User Experience Polish**
   - Add loading states and animations
   - Implement drag-and-drop file organization
   - Add keyboard shortcuts and accessibility features
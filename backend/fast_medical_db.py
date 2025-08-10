#!/usr/bin/env python3
"""
Fast Medical Database - SQLite-based medical term lookup
Pre-processes and indexes all medical databases for instant access
"""
import sqlite3
import json
import time
import os
from typing import List, Tuple, Dict, Any

class FastMedicalDatabase:
    def __init__(self, db_path: str = "fast_medical.db"):
        self.db_path = db_path
        self.conn = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize the SQLite database with optimized schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")  # Better performance
        self.conn.execute("PRAGMA synchronous=NORMAL")  # Faster writes
        self.conn.execute("PRAGMA cache_size=10000")  # More memory cache
        
        # Create optimized tables
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS medical_terms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term TEXT NOT NULL,
                category TEXT NOT NULL,
                source_db TEXT NOT NULL,
                code TEXT,
                confidence REAL DEFAULT 0.95,
                term_lower TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_term_lower ON medical_terms(term_lower);
            CREATE INDEX IF NOT EXISTS idx_category ON medical_terms(category);
            CREATE INDEX IF NOT EXISTS idx_source ON medical_terms(source_db);
            CREATE INDEX IF NOT EXISTS idx_term_category ON medical_terms(term_lower, category);
            
            CREATE TABLE IF NOT EXISTS db_metadata (
                source_db TEXT PRIMARY KEY,
                total_terms INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version TEXT
            );
        """)
        self.conn.commit()
    
    def is_database_populated(self) -> bool:
        """Check if database is already populated"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM medical_terms")
        count = cursor.fetchone()[0]
        return count > 1000  # Minimum threshold
    
    def populate_database(self):
        """Populate database with all medical terms"""
        if self.is_database_populated():
            print("✅ Fast medical database already populated!")
            return
        
        print("🔄 Building fast medical database...")
        print("⚠️  Database not populated. Please run expand_medical_db.py first!")
        return
    
    def search_terms(self, text: str, limit: int = 100) -> List[Tuple[str, str, str]]:
        """Fast search for medical terms in text"""
        if not self.conn:
            return []
        
        # Split text into words for searching
        words = text.lower().split()
        results = []
        
        # Search for exact matches and partial matches
        cursor = self.conn.cursor()
        
        # First, search for exact phrase matches
        cursor.execute("""
            SELECT DISTINCT term, category, source_db, confidence
            FROM medical_terms 
            WHERE ? LIKE '%' || term_lower || '%'
            ORDER BY LENGTH(term) DESC, confidence DESC
            LIMIT ?
        """, (text.lower(), limit))
        
        for row in cursor.fetchall():
            results.append((row[0], row[1], row[2]))
        
        return results[:limit]
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        cursor = self.conn.cursor()
        
        # Total terms
        cursor.execute("SELECT COUNT(*) FROM medical_terms")
        total_terms = cursor.fetchone()[0]
        
        # Terms by category
        cursor.execute("""
            SELECT category, COUNT(*) 
            FROM medical_terms 
            GROUP BY category 
            ORDER BY COUNT(*) DESC
        """)
        categories = dict(cursor.fetchall())
        
        # Terms by source
        cursor.execute("""
            SELECT source_db, COUNT(*) 
            FROM medical_terms 
            GROUP BY source_db 
            ORDER BY COUNT(*) DESC
        """)
        sources = dict(cursor.fetchall())
        
        return {
            "total_terms": total_terms,
            "categories": categories,
            "sources": sources,
            "database_size": os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0
        }
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

# Global instance for reuse
_fast_db_instance = None

def get_fast_medical_db() -> FastMedicalDatabase:
    """Get singleton instance of fast medical database"""
    global _fast_db_instance
    if _fast_db_instance is None:
        _fast_db_instance = FastMedicalDatabase()
        _fast_db_instance.populate_database()
    return _fast_db_instance
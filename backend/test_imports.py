#!/usr/bin/env python3
"""
Test script to verify AI package imports
"""

print("Testing AI package imports...")

try:
    from transformers import AutoTokenizer
    import numpy as np
    from PIL import Image
    AI_PACKAGES_AVAILABLE = True
    print("✅ AI packages loaded successfully!")
except ImportError as e:
    print(f"❌ AI packages not installed: {e}")
    AI_PACKAGES_AVAILABLE = False

# Optional imports (for full functionality)
try:
    import torch
    from transformers import AutoModel
    TORCH_AVAILABLE = True
    print("✅ PyTorch available")
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not available - using basic text analysis only")

try:
    import cv2
    CV2_AVAILABLE = True
    print("✅ OpenCV available")
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️  OpenCV not available - image analysis disabled")

print(f"\nSummary:")
print(f"AI_PACKAGES_AVAILABLE: {AI_PACKAGES_AVAILABLE}")
print(f"TORCH_AVAILABLE: {TORCH_AVAILABLE}")
print(f"CV2_AVAILABLE: {CV2_AVAILABLE}")
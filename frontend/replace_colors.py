import os
import re

directories_to_scan = [
    r'c:\Users\SWARNAVA\OneDrive\Desktop\PerformPro\frontend\src\pages',
    r'c:\Users\SWARNAVA\OneDrive\Desktop\PerformPro\frontend\src\components'
]

replacements = [
    (r'\btext-white\b', 'text-gray-900'),
    (r'\btext-slate-400\b', 'text-gray-600'),
    (r'\btext-slate-300\b', 'text-gray-700'),
    (r'\btext-slate-500\b', 'text-gray-500'),
    (r'\bglass-card\b', 'bg-white shadow-sm border border-gray-100 rounded-2xl'),
    (r'\bbg-white/5\b', 'bg-white border border-gray-200'),
    (r'\bbg-white/10\b', 'bg-gray-100'),
    (r'\bborder-white/10\b', 'border-gray-200'),
    (r'\bborder-white/5\b', 'border-gray-200'),
    (r'\bborder-white/20\b', 'border-gray-300'),
    (r'\bg-slate-800\b', 'bg-white shadow-sm border-gray-200'),
    (r'\btext-slate-200\b', 'text-gray-900'),
]

for directory in directories_to_scan:
    for filename in os.listdir(directory):
        if filename.endswith(".jsx"):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filename}")

print("Done.")

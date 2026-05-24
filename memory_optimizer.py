#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bolt Memory Optimizer — Hex phan tich + toi uu tri nho hang tuan (FREE)"""
import os, json, datetime, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

MEMORY_DIR = os.path.expandvars(r"%USERPROFILE%\.openclaw\workspace\memory")
HEX_URL = "http://192.168.178.48:5001/api/v1/generate"
import requests

def count_stats():
    """Dem so file, token estimate"""
    stats = {"daily_files": 0, "cat_folders": 0, "total_size_kb": 0, "index_lines": 0}
    cats_dir = os.path.join(MEMORY_DIR, "categories")
    
    for f in os.listdir(MEMORY_DIR):
        fp = os.path.join(MEMORY_DIR, f)
        if f.endswith(".md") and f[:4].isdigit():
            stats["daily_files"] += 1
            stats["total_size_kb"] += os.path.getsize(fp) / 1024
    
    if os.path.exists(cats_dir):
        for d in os.listdir(cats_dir):
            dp = os.path.join(cats_dir, d)
            if os.path.isdir(dp):
                stats["cat_folders"] += 1
                for f in os.listdir(dp):
                    stats["total_size_kb"] += os.path.getsize(os.path.join(dp, f)) / 1024
    
    idx_path = os.path.join(MEMORY_DIR, "INDEX.md")
    if os.path.exists(idx_path):
        stats["index_lines"] = len(open(idx_path, encoding='utf-8').readlines())
        stats["total_size_kb"] += os.path.getsize(idx_path) / 1024
    
    return stats

def analyze_with_hex(stats):
    """Hex phan tich + de xuat"""
    prompt = f"""Phan tich bo nho Bolt hien tai:
- {stats['daily_files']} file nhat ky ngay
- {stats['cat_folders']} folder danh muc
- INDEX.md: {stats['index_lines']} dong
- Tong dung luong: {stats['total_size_kb']:.1f}KB

Hay de xuat:
1. Co nen nen bo nho khong? (neu >30 daily files hoac >100 dong INDEX)
2. Folder nao chua co README?
3. Cach toi uu token cho tuan tiep theo
Tra loi ngan gon tieng Viet, 3-5 dong."""
    
    try:
        r = requests.post(HEX_URL, json={"prompt": prompt, "max_length": 300, "temperature": 0.3})
        return r.json()["results"][0]["text"].strip()
    except:
        return "Hex offline - khong the phan tich"

if __name__ == "__main__":
    stats = count_stats()
    print(f"📊 Bolt Memory Stats — {datetime.date.today()}")
    print(f"   Daily files : {stats['daily_files']}")
    print(f"   Categories  : {stats['cat_folders']}")
    print(f"   INDEX lines : {stats['index_lines']}")
    print(f"   Total size  : {stats['total_size_kb']:.1f}KB")
    
    advice = analyze_with_hex(stats)
    print(f"\n🧠 Hex Analysis:\n{advice}")
    
    # Save report
    report_path = os.path.join(MEMORY_DIR, "weekly-memory-report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# Weekly Memory Report — {datetime.date.today()}\n\n")
        f.write(f"- Files: {stats['daily_files']} daily + {stats['cat_folders']} categories\n")
        f.write(f"- Size: {stats['total_size_kb']:.1f}KB\n")
        f.write(f"- INDEX: {stats['index_lines']} lines\n\n")
        f.write(f"## Hex Analysis\n{advice}\n")
    print(f"\n✅ Report saved: {report_path}")

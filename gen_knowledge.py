#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DeployAI Knowledge Generator — Tu dong sinh bai viet AI bang Hex"""
import requests, json, os, sys, datetime
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HEX_URL = "http://192.168.178.48:5001/api/v1/generate"
OUT_DIR = "src/content/knowledge"
os.makedirs(OUT_DIR, exist_ok=True)

TOPICS = [
    # AI Cơ Bản
    ("ai-la-gi", "AI Là Gì? Giải Thích Từ A-Z Cho Người Mới Bắt Đầu", "ai-co-ban"),
    ("llm-hoat-dong-nhu-the-nao", "LLM Hoạt Động Như Thế Nào? Giải Thích Đơn Giản", "ai-co-ban"),
    ("machine-learning-la-gi", "Machine Learning Là Gì? Phân Biệt Với AI Và Deep Learning", "ai-co-ban"),
    ("deep-learning-giai-thich-don-gian", "Deep Learning Là Gì? Giải Thích Đơn Giản Cho Người Kinh Doanh", "ai-co-ban"),
    ("neural-network-co-ban", "Neural Network — Mạng Nơ-ron Nhân Tạo Là Gì?", "ai-co-ban"),
    ("nlp-xu-ly-ngon-ngu-tu-nhien", "NLP — Xử Lý Ngôn Ngữ Tự Nhiên Là Gì?", "ai-co-ban"),
    ("computer-vision-la-gi", "Computer Vision Là Gì? AI Nhìn Thế Giới Như Thế Nào?", "ai-co-ban"),
    ("ai-trong-doi-song-hang-ngay", "AI Trong Đời Sống Hàng Ngày — 20 Ví Dụ Bạn Dùng Mỗi Ngày", "ai-co-ban"),
    ("phan-biet-ai-machine-learning-deep-learning", "Phân Biệt AI, Machine Learning, Deep Learning", "ai-co-ban"),
    ("ai-sinh-la-gi", "AI Sinh (Generative AI) Là Gì? Cách Mạng Sáng Tạo 2026", "ai-co-ban"),
    
    # Thuật ngữ AI
    ("prompt-la-gi", "Prompt Là Gì? Nghệ Thuật Giao Tiếp Với AI", "thuat-ngu"),
    ("token-trong-ai-la-gi", "Token Trong AI Là Gì? Cách Tính Chi Phí API", "thuat-ngu"),
    ("rag-la-gi", "RAG (Retrieval-Augmented Generation) Là Gì?", "thuat-ngu"),
    ("fine-tuning-la-gi", "Fine-Tuning Là Gì? Khi Nào Cần Huấn Luyện Lại AI?", "thuat-ngu"),
    ("embedding-vector-la-gi", "Embedding & Vector — Cách AI Hiểu Ngữ Nghĩa", "thuat-ngu"),
    ("hallucination-trong-ai", "Hallucination Trong AI Là Gì? Tại Sao AI Bịa Chuyện?", "thuat-ngu"),
    ("context-window-la-gi", "Context Window Là Gì? Bộ Nhớ Của AI Hoạt Động Sao?", "thuat-ngu"),
    ("temperature-trong-ai", "Temperature Trong AI — Kiểm Soát Độ Sáng Tạo", "thuat-ngu"),
    ("inference-la-gi", "Inference Là Gì? AI Suy Luận Như Thế Nào?", "thuat-ngu"),
    ("training-data", "Training Data — Dữ Liệu Huấn Luyện AI Là Gì?", "thuat-ngu"),
    
    # Công cụ AI
    ("chatgpt-la-gi", "ChatGPT Là Gì? Hướng Dẫn Toàn Diện 2026", "cong-cu"),
    ("deepseek-la-gi", "DeepSeek Là Gì? Đối Thủ Mã Nguồn Mở Của ChatGPT", "cong-cu"),
    ("claude-ai-la-gi", "Claude AI Là Gì? So Sánh Với ChatGPT Và DeepSeek", "cong-cu"),
    ("gemini-ai-la-gi", "Gemini AI Của Google — Mọi Thứ Bạn Cần Biết", "cong-cu"),
    ("midjourney-la-gi", "Midjourney Là Gì? Hướng Dẫn Tạo Ảnh Bằng AI", "cong-cu"),
    ("canva-ai", "Canva AI — Thiết Kế Chuyên Nghiệp Không Cần Designer", "cong-cu"),
    ("github-copilot", "GitHub Copilot — AI Viết Code Cho Lập Trình Viên", "cong-cu"),
    ("notion-ai", "Notion AI — Trợ Lý Viết Lách Trong Ứng Dụng Ghi Chú", "cong-cu"),
    ("perplexity-ai", "Perplexity AI — Công Cụ Tìm Kiếm Bằng AI Tốt Nhất", "cong-cu"),
    ("gamma-app", "Gamma App Là Gì? Tạo Slide & Tài Liệu Bằng AI", "cong-cu"),
    
    # Ứng dụng AI
    ("ai-trong-ban-hang-online", "AI Trong Bán Hàng Online — 10 Ứng Dụng Thực Tế", "ung-dung"),
    ("ai-trong-marketing", "AI Trong Marketing — Tự Động Hóa Chiến Dịch Quảng Cáo", "ung-dung"),
    ("ai-trong-ke-toan", "AI Trong Kế Toán — Tự Động Hóa Sổ Sách Cho SMEs", "ung-dung"),
    ("ai-trong-nha-hang", "AI Trong Nhà Hàng — Từ Đặt Bàn Đến Quản Lý Bếp", "ung-dung"),
    ("ai-trong-khach-san", "AI Trong Khách Sạn — Cách Mạng Hóa Trải Nghiệm Khách", "ung-dung"),
    ("ai-trong-du-lich", "AI Trong Du Lịch — Chốt Tour 24/7 Không Cần Người", "ung-dung"),
    ("ai-trong-y-te", "AI Trong Y Tế — Chẩn Đoán, Điều Trị Và Quản Lý Bệnh Viện", "ung-dung"),
    ("ai-trong-giao-duc", "AI Trong Giáo Dục — Cá Nhân Hóa Học Tập Cho Mọi Người", "ung-dung"),
    ("ai-trong-bat-dong-san", "AI Trong Bất Động Sản — Định Giá & Tìm Kiếm Thông Minh", "ung-dung"),
    ("ai-trong-nong-nghiep", "AI Trong Nông Nghiệp — Canh Tác Thông Minh 2026", "ung-dung"),
    
    # Xu hướng
    ("ai-agent-la-gi", "AI Agent Là Gì? Xu Hướng AI Tự Động Hóa 2026", "xu-huong"),
    ("ai-thay-doi-viec-lam", "AI Thay Đổi Việc Làm Như Thế Nào? Cơ Hội & Thách Thức", "xu-huong"),
    ("open-source-ai", "Open Source AI — Cuộc Cách Mạng Mã Nguồn Mở 2026", "xu-huong"),
    ("ai-va-quy-dinh-phap-ly", "AI Và Quy Định Pháp Lý — Doanh Nghiệp Cần Biết Gì?", "xu-huong"),
    ("ai-va-bao-mat-du-lieu", "AI Và Bảo Mật Dữ Liệu — 5 Nguyên Tắc Quan Trọng", "xu-huong"),
    ("tuong-lai-ai-2027", "Tương Lai AI 2027 — Dự Đoán Xu Hướng Sắp Tới", "xu-huong"),
    ("ai-va-kinh-te-viet-nam", "AI Và Kinh Tế Việt Nam — Cơ Hội Ngàn Tỷ", "xu-huong"),
    ("ai-edge-computing", "AI Edge Computing — Xử Lý Ngay Trên Thiết Bị", "xu-huong"),
    ("ai-da-phuong-thuc", "AI Đa Phương Thức (Multimodal) — Nhìn, Nghe, Hiểu", "xu-huong"),
    ("ai-va-blockchain", "AI Và Blockchain — Cặp Đôi Công Nghệ Tương Lai", "xu-huong"),
]

def generate(slug, title, category):
    prompt = f"""Viết bài blog chuyên nghiệp bằng tiếng Việt, chuẩn SEO về chủ đề:
"{title}"

Yêu cầu:
- Độ dài: 800-1200 từ
- Giọng văn: Chuyên nghiệp, dễ hiểu, thân thiện
- Cấu trúc: TL;DR (2 câu tóm tắt), 4-5 phần chính với H2, FAQ (3 câu), CTA
- Người đọc: Chủ doanh nghiệp nhỏ VN muốn tìm hiểu AI
- SEO: Dùng từ khóa tự nhiên, không nhồi nhét
- Định dạng: Markdown, dùng **in đậm** cho keyword"""
    
    try:
        r = requests.post(HEX_URL, json={
            "prompt": prompt, "max_length": 2000, "temperature": 0.7,
            "stop_sequence": ["Here's a thinking", "thinking process:", "1. **Analyze", "Let me", "I need to", "I'll", "wait,", "Wait,", "(wait", "(Wait"]
        })
        text = r.json()["results"][0]["text"]
        text = text.replace("<think>", "").replace("</think>", "")
        return text.strip()
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def save(slug, title, category, content):
    date = datetime.date.today().isoformat()
    md = f"""---
title: "{title}"
description: "Bài viết chuyên sâu về {title.lower()} — giải thích đơn giản cho người kinh doanh."
date: "{date}"
category: "{category}"
tags: ["AI", "kiến thức", "{category}"]
author: "DeployAI"
---

{content}
"""
    path = os.path.join(OUT_DIR, f"{slug}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  ✅ Saved: {slug}")

if __name__ == "__main__":
    print(f"Generating {len(TOPICS)} articles with Hex...")
    for i, (slug, title, cat) in enumerate(TOPICS):
        print(f"[{i+1}/{len(TOPICS)}] {title[:60]}...")
        content = generate(slug, title, cat)
        if content:
            save(slug, title, cat, content)
    print("Done!")

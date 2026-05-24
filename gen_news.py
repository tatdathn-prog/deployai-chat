#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DeployAI News Aggregator — Tu dong thu thap & viet tin AI"""
import requests, json, os, sys, datetime, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HEX_URL = "http://192.168.178.48:5001/api/v1/generate"
OUT_DIR = "src/content/news"
os.makedirs(OUT_DIR, exist_ok=True)

# AI News sources to summarize
NEWS_SOURCES = [
    # AI breakthroughs & releases
    {
        "topic": "AI moi nhat thang 5-2026: DeepSeek, GPT-5, Claude, Gemini cap nhat",
        "title": "Tin AI Tháng 5/2026: DeepSeek V4, GPT-5, Claude 4 — Có Gì Mới?",
        "cat": "Tin AI",
    },
    {
        "topic": "OpenAI ra mat tinh nang moi thang 5-2026 ChatGPT Codex",
        "title": "OpenAI Vừa Ra Mắt Tính Năng Mới: ChatGPT + Codex Hợp Nhất",
        "cat": "Tin AI",
    },
    {
        "topic": "Google DeepMind ra mat Gemini 3 AI moi nhat 2026",
        "title": "Google DeepMind Ra Mắt Gemini 3: Đột Phá AI Đa Phương Thức",
        "cat": "Tin AI",
    },
    {
        "topic": "Anthropic Claude 4 ra mat tinh nang moi 2026",
        "title": "Anthropic Claude 4: Tính Năng Mới Cho Doanh Nghiệp",
        "cat": "Tin AI",
    },
    {
        "topic": "DeepSeek V4 mo hinh AI ma nguon mo vuot GPT-5 2026",
        "title": "DeepSeek V4: AI Mã Nguồn Mở Vượt Mặt GPT-5 Trên Nhiều Bài Test",
        "cat": "Tin AI",
    },
    # AI in Vietnam
    {
        "topic": "AI Viet Nam 2026 startups cong nghe tri tue nhan tao",
        "title": "AI Việt Nam 2026: Startup AI Nào Đang Dẫn Đầu?",
        "cat": "AI Việt Nam",
    },
    {
        "topic": "doanh nghiep Viet Nam ung dung AI chatbot 2026",
        "title": "Doanh Nghiệp Việt Ứng Dụng AI Chatbot: Xu Hướng 2026",
        "cat": "AI Việt Nam",
    },
    {
        "topic": "Chinh phu Viet Nam chien luoc AI quoc gia 2026",
        "title": "Chiến Lược AI Quốc Gia: Việt Nam Đặt Mục Tiêu Gì Đến 2030?",
        "cat": "AI Việt Nam",
    },
    # Business applications
    {
        "topic": "AI agent tu dong hoa doanh nghiep SMEs 2026",
        "title": "AI Agent Cho Doanh Nghiệp SMEs: Từ Xu Hướng Đến Thực Tế",
        "cat": "Ứng Dụng",
    },
    {
        "topic": "AI thay the nhan vien cham soc khach hang 2026",
        "title": "AI Đang Thay Thế Nhân Viên CSKH Như Thế Nào Năm 2026?",
        "cat": "Ứng Dụng",
    },
    {
        "topic": "AI tu dong hoa quy trinh kinh doanh ROI 2026",
        "title": "ROI Của AI Tự Động Hóa: Doanh Nghiệp Tiết Kiệm Được Bao Nhiêu?",
        "cat": "Ứng Dụng",
    },
    {
        "topic": "AI viet content marketing social media 2026",
        "title": "AI Viết Content Marketing 2026: 5 Công Cụ Tốt Nhất Cho Doanh Nghiệp",
        "cat": "Ứng Dụng",
    },
    # Tools & platforms
    {
        "topic": "top cong cu AI cho doanh nghiep nho 2026 mien phi",
        "title": "Top 15 Công Cụ AI Miễn Phí Cho Doanh Nghiệp Nhỏ 2026",
        "cat": "Công Cụ",
    },
    {
        "topic": "n8n automation AI workflow tu dong hoa 2026",
        "title": "n8n + AI: Tự Động Hóa Workflow Cho Doanh Nghiệp Không Cần Code",
        "cat": "Công Cụ",
    },
    {
        "topic": "so sanh ChatGPT vs Claude vs DeepSeek doanh nghiep 2026",
        "title": "So Sánh Chi Tiết: ChatGPT vs Claude vs DeepSeek — AI Nào Cho Doanh Nghiệp?",
        "cat": "Công Cụ",
    },
    # Market & trends
    {
        "topic": "thi truong AI toan cau 2026 du bao tang truong",
        "title": "Thị Trường AI Toàn Cầu 2026: Dự Báo Tăng Trưởng & Cơ Hội",
        "cat": "Thị Trường",
    },
    {
        "topic": "AI thay doi nganh ban le thuong mai dien tu 2026",
        "title": "AI Thay Đổi Ngành Bán Lẻ & Thương Mại Điện Tử Năm 2026",
        "cat": "Thị Trường",
    },
    {
        "topic": "dau tu AI startups toan cau 2026 xu huong",
        "title": "Đầu Tư Vào AI Startups 2026: Xu Hướng & Cơ Hội",
        "cat": "Thị Trường",
    },
    # Regulation & ethics
    {
        "topic": "luat AI chau Au EU AI Act doanh nghiep can biet 2026",
        "title": "Luật AI Châu Âu (EU AI Act): Doanh Nghiệp Việt Cần Biết Gì?",
        "cat": "Pháp Lý",
    },
    {
        "topic": "dao duc AI trach nhiem su dung tri tue nhan tao",
        "title": "Đạo Đức AI: 7 Nguyên Tắc Sử Dụng Trí Tuệ Nhân Tạo Có Trách Nhiệm",
        "cat": "Pháp Lý",
    },
]

def gen_news(topic, title, cat):
    prompt = f"""Viết bài tin tức AI chuyên nghiệp bằng tiếng Việt về chủ đề:
"{topic}"

Yêu cầu:
- Định dạng như 1 bài báo tin tức công nghệ, không phải blog hướng dẫn
- Tiêu đề: "{title}"
- Cấu trúc: Tóm tắt 2 câu đầu, 4-5 phần với H2, kết luận
- Giọng văn: Chuyên nghiệp, cập nhật, đáng tin cậy
- SEO: Dùng từ khóa tự nhiên
- Độ dài: 600-900 từ
- Thêm phần "Nguồn tham khảo" cuối bài (các trang tin AI uy tín)"""

    try:
        r = requests.post(HEX_URL, json={
            "prompt": prompt, "max_length": 1500, "temperature": 0.7,
            "stop_sequence": ["Here's a thinking", "thinking process:", "1. **Analyze", "Let me", "I need to", "wait,", "(wait"]
        })
        text = r.json()["results"][0]["text"]
        text = text.replace("<think>", "").replace("</think>", "")
        return text.strip()
    except Exception as e:
        print(f"  Error: {e}")
        return None

def save(slug, title, cat, content):
    date = datetime.date.today().isoformat()
    md = f"""---
title: "{title}"
description: "Tin tức AI mới nhất — {title.lower()}"
date: "{date}"
category: "{cat}"
tags: ["AI", "tin tức", "{cat.lower()}"]
author: "DeployAI"
---

{content}
"""
    path = os.path.join(OUT_DIR, f"{slug}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  Saved: {slug}")

if __name__ == "__main__":
    print(f"Generating {len(NEWS_SOURCES)} news articles...")
    for i, src in enumerate(NEWS_SOURCES):
        print(f"[{i+1}/{len(NEWS_SOURCES)}] {src['title'][:60]}...")
        slug = src['topic'].lower().replace(" ", "-")[:60].rstrip("-")
        content = gen_news(src['topic'], src['title'], src['cat'])
        if content:
            save(slug, src['title'], src['cat'], content)
    print("Done!")

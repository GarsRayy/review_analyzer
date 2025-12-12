import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables dari file .env (jika ada)
load_dotenv()

# Ambil API Key
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ Error: API Key tidak ditemukan. Pastikan file .env sudah benar atau set manual di kode.")
else:
    try:
        genai.configure(api_key=api_key)
        
        print("🔍 Mengecek model yang tersedia...\n")
        
        # Ambil semua model
        models = genai.list_models()
        
        found_models = []
        for m in models:
            # Kita hanya butuh model yang bisa generate text (generateContent)
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Model Name: {m.name}")
                print(f"   Display Name: {m.display_name}")
                print(f"   Version: {m.version}")
                print("-" * 30)
                found_models.append(m.name)
        
        if not found_models:
            print("⚠️ Tidak ada model yang ditemukan. Cek kembali API Key atau region kamu.")
            
    except Exception as e:
        print(f"❌ Terjadi kesalahan: {e}")
# AI LOCAL STACK STATUS
# Generated: 2026-08-21
# Hardware baseline for local AI stack

SYSTEM
OS: macOS 12.7.6
CPU: Intel Core i5 dual-core 2.9GHz (MacBookPro12,1)
RAM: 16GB DDR3 1867MHz
GPU: Intel Iris Graphics 6100 (1.5GB shared VRAM, Metal supported)
Storage: 500GB SSD, 293GB free
Architecture: x86_64

TOOLS
Python: 3.11.15 in venv, 3.9.6 system
Homebrew: 6.0.18
Git: 2.37.1
Node.js: 22.23.2
npm: 10.9.8
Docker: installed, server NOT running
FFmpeg: not installed
Ollama: not installed
ComfyUI: not found
n8n: not found

HARDWARE CONSTRAINTS
- CPU inference only; no NVIDIA/AMD discrete GPU
- Intel Iris 6100 is not ideal for diffusion/FLUX
- 16GB RAM limits large model loading
- macOS 12.7.6; some newer tools may require newer OS

SECURITY RULES
- Only official sources: GitHub, Homebrew, PyPI, Docker Hub
- No unknown scripts from internet
- No API keys requested or created
- No sudo unless strictly necessary

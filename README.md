<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 18agentsreal collection runtime

This repository contains the internal collection dashboard and the real DB-backed runtime worker/API for 18-governorate collection orchestration.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set variables from [.env.example](.env.example)
3. Run the dashboard:
   `npm run dev`

4. Run the collection worker (separate terminal):
   `npm run worker:collection`

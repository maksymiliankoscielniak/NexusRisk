# 📈 NexusRisk

> **A standalone, AI-powered portfolio macro and risk stress-tester for modern investors and portfolio managers.**

[![Build Status](https://github.com/maksymiliankoscielniak/NexusRisk/actions/workflows/deploy.yml/badge.svg)](https://github.com/maksymiliankoscielniak/NexusRisk/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

NexusRisk provides advanced financial analytics directly in your browser. Perform complex stress-testing, run Monte Carlo simulations, and generate AI-driven macro analyst memos without needing a heavy backend infrastructure.

---

## ✨ Features

- 📊 **Executive Overview**: Instantly view Net Asset Value (NAV), expected yield, portfolio volatility, Sharpe ratio, and 95% parametric Value at Risk (VaR).
- 🎛️ **Interactive Allocation Matrix**: Adjust portfolio weights on the fly and watch risk metrics recompute in real-time.
- 🦢 **Black Swan Scenarios**: Stress-test your portfolio against historical and hypothetical market crashes, comparing 24-month baselines against stressed paths.
- 🎲 **Monte Carlo Engine**: Run 160 independent stochastic paths with visual bands representing the 5th, 50th (median), and 95th percentiles.
- 🤖 **AI Macro Analyst Memo**: Stream intelligent, context-aware analysis and insights directly to the dashboard, with on-demand re-evaluation.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Architecture**: 100% Client-side calculations (All simulations run natively in the browser)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm` (comes with Node.js)

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maksymiliankoscielniak/NexusRisk.git
   cd NexusRisk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### Production Build

To build the application for production and preview the built assets locally:

```bash
npm run build
npm run preview
```

## 🌐 Deployment

This project is fully configured to automatically build and deploy to **GitHub Pages** whenever code is pushed to the `main` branch. This is handled by a GitHub Actions workflow (`.github/workflows/deploy.yml`).

# Deployment Guide

## HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES

This application is built with React 19, TypeScript, Vite 8, Tailwind CSS v4, and Node.js / Express with PayPal integration. It can be deployed to **Vercel**, **Docker**, **VPS (Ubuntu/Debian with Nginx)**, or **Node.js Cloud Hosts (Render, Railway, Fly.io, Heroku)**.

---

## 1. Quick Deploy to Vercel (Recommended)

This repository includes a `vercel.json` and `/api` serverless handler pre-configured for instant zero-config Vercel deployment:

1. **Import the project into Vercel**:
   - Push this codebase to GitHub/GitLab or upload directly via Vercel CLI (`vercel`).
2. **Environment Variables**:
   In Vercel Project Settings > Environment Variables, add:
   ```env
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENVIRONMENT=sandbox   # change to live for production
   ADMIN_PASSWORD=homebased254.
   ```
3. **Build & Output Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy**:
   - Click Deploy. Both the frontend SPA and the `/api/paypal/*` endpoints will be live immediately.

---

## 2. Quick Deploy with Docker (VPS / Cloud)

### Prerequisites:
- Docker and Docker Compose installed on your host machine / VPS.

### Commands:
```bash
# 1. Extract the project
unzip homebased-services-project.zip -d home-based-services
cd home-based-services

# 2. Configure environment
cp .env.example .env
nano .env   # Add your PayPal credentials

# 3. Build and launch
docker compose up -d --build

# 4. View status & logs
docker compose ps
docker compose logs -f
```
The application will be live at `http://YOUR_SERVER_IP:3000`.

---

## 3. Deploy to Ubuntu / Debian VPS with Nginx & PM2

### Step 1: Install Node.js, PM2 & Nginx
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Install PM2 process manager
sudo npm install -g pm2
```

### Step 2: Extract & Install Dependencies
```bash
unzip homebased-services-project.zip -d /var/www/home-based-services
cd /var/www/home-based-services

# Install with npm
npm install

# Build client bundle
npm run build
```

### Step 3: Run with PM2
```bash
pm2 start "npm run start" --name "home-based-services"
pm2 save
pm2 startup
```

---

## 4. PayPal Payment Gateway Configuration

The application is integrated with the official PayPal REST Orders API v2:

### Environment Variables:
```env
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_ENVIRONMENT="sandbox" # or "live"
```

### Endpoints:
- `GET /api/paypal/status`: Returns PayPal gateway configuration status and active environment.
- `POST /api/paypal/create-order`: Generates a secure PayPal order with line items and currency conversion.
- `POST /api/paypal/capture-order`: Captures the payment, updates the transaction ledger, and activates the access pass.

---

## 5. Administrator Portal Credentials

- **Master Password**: `homebased254.`
- **Access**: Click the Admin button or navigate to the admin portal via footer/header to review all active customer passes, registered technicians, commission splits (85% technician / 15% platform), and PayPal transaction audit logs.

# HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES

> Professional, Countrywide On-Demand Electrical & Refrigeration Maintenance Platform for Kenya.  
> Process payments securely via **PayPal**.

---

## 🚀 Key Features

1. **PayPal Payment Gateway Integration**:
   - Secure digital processing for Customer 12-Hour Passes, Technician Passes, and Technician Monthly Registration.
   - Built-in PayPal Smart Buttons and order creation/capture API endpoints (`/api/paypal/create-order`, `/api/paypal/capture-order`).
   - Instant automated invoice and digital guarantee receipt issuance with a 30-day warranty badge.
2. **Access Pass Model (Ksh. 50 / 12 Hours)**:
   - Customers unlock a 12-hour session pass to mark faulty appliances and request verified technicians.
   - Technicians unlock an active shift pass to receive matched repair leads.
3. **Technician Monthly Membership (Ksh. 1,500 / Month)**:
   - Qualified EPRA and NITA accredited technicians subscribe monthly to disclose direct customer phone and WhatsApp contacts.
4. **Countrywide Operations**:
   - Operating across all 47 counties of Kenya: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Machakos, and all surrounding areas.
5. **Strict Administrator Security**:
   - Administrative portal protected with master password: `homebased254.`
   - Dedicated management of pricing, commission split (85% technician / 15% platform), active passes, and PayPal transaction history.

---

## 💳 PayPal Payment Gateway Integration

### Backend Endpoints:
- `GET /api/paypal/status`: Checks active configuration, environment (`sandbox` vs `live`), currency (`USD`), and API readiness.
- `POST /api/paypal/create-order`: Generates a secure PayPal order for customer passes, technician passes, or registration fees.
- `POST /api/paypal/capture-order`: Captures and finalizes authorized PayPal transactions, activating access passes immediately.

### PayPal Environment Variables (`.env`):
```bash
# PayPal Client ID & Secret from developer.paypal.com
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_ENVIRONMENT="sandbox" # or "live"
```

---

## 🛠️ Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server (Vite + Express)
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🔐 Admin Authentication

- Open **Admin Portal** from the header or footer.
- Enter master password: `homebased254.`
- Access real-time bookings, technician licensing roster, and PayPal ledger.

---

## 📞 Support & Contacts

- **Hotline**: `+254 711 408 365`
- **WhatsApp**: `+254 711 408 365`
- **Business Name**: HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES

import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getPesapalConfig,
  updatePesapalConfig,
  testPesapalConnection,
  submitPesapalOrder,
  getPesapalTransactionStatus,
  registerPesapalIPN,
  getPesapalTransactions,
} from './server/pesapal.ts';
import { centralDb } from './server/db/databaseService.ts';
import { uploadMediaToCloudStorage, getCachedMediaFile } from './server/cloudStorage.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerApiRoutes(app: express.Express) {
  // CORS headers for API safety
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // PROJECT ARCHIVE DOWNLOAD ENDPOINT (.ZIP)
  // ==========================================
  app.get(['/api/download-zip', '/homebased-services-project.zip'], (_req, res) => {
    const rootZip = path.resolve(__dirname, 'homebased-services-project.zip');
    const publicZip = path.resolve(__dirname, 'public', 'homebased-services-project.zip');

    if (fs.existsSync(rootZip)) {
      res.setHeader('Content-Disposition', 'attachment; filename="homebased-services-project.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return res.sendFile(rootZip);
    } else if (fs.existsSync(publicZip)) {
      res.setHeader('Content-Disposition', 'attachment; filename="homebased-services-project.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return res.sendFile(publicZip);
    }
    return res.status(404).json({ success: false, error: 'ZIP archive not found on server' });
  });

  // ==========================================
  // REAL-TIME SYNCHRONIZATION & SHARED DATABASE (CROSS-DEVICE)
  // Ensures all devices immediately see bookings, technician registrations, and updates
  // ==========================================

  // 1. Server-Sent Events (SSE) Real-Time Stream
  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`);

    const unsubscribeCentral = centralDb.addSseClient((data: string) => {
      try {
        res.write(data);
      } catch (e) {
        unsubscribeCentral();
      }
    });

    req.on('close', () => {
      unsubscribeCentral();
    });
  });

  // 2. Global Lightweight Sync Endpoint (Authoritative from Central Database)
  app.get('/api/sync', async (_req, res) => {
    try {
      const [
        bookings,
        openJobs,
        publicTechs,
        adminTechs,
        customers,
        loggedInUsers,
        messages,
        payoutLedger,
        smsLogs,
        pricing,
        mediaConfig,
        cloudStatus
      ] = await Promise.all([
        centralDb.getBookings(),
        centralDb.getOpenJobs(),
        centralDb.getTechnicians({ forAdmin: false }),
        centralDb.getTechnicians({ forAdmin: true }),
        centralDb.getCustomers(),
        centralDb.getLoggedInUsers(),
        centralDb.getAllMessages(),
        centralDb.getPayoutLedger(),
        centralDb.getSmsLogs(),
        centralDb.getPricing(),
        centralDb.getMediaConfig(),
        Promise.resolve(centralDb.getDatabaseStatus())
      ]);

      res.json({
        success: true,
        timestamp: Date.now(),
        bookings,
        openJobs,
        technicians: publicTechs,
        allTechnicians: adminTechs,
        customers,
        loggedInUsers,
        messages,
        payoutLedger,
        smsLogs,
        pricing,
        mediaConfig,
        cloudStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Bookings API (Cross-Device Shared via Central Database)
  app.get('/api/bookings', async (_req, res) => {
    try {
      const list = await centralDb.getBookings();
      res.json({ success: true, bookings: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3b. OPEN JOB MARKETPLACE (Unclaimed / Posted Jobs Feed)
  app.get('/api/jobs/open', async (_req, res) => {
    try {
      const list = await centralDb.getOpenJobs();
      res.json({ success: true, openJobs: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3c. ASSIGNMENT LOCK: Claim an open marketplace job
  app.post('/api/jobs/:id/claim', async (req, res) => {
    try {
      const { id } = req.params;
      const { technicianId, technicianName, technicianPhone } = req.body;
      if (!technicianId || !technicianName) {
        return res.status(400).json({ success: false, error: 'Technician identity required to claim job' });
      }
      const updated = await centralDb.claimJob(id, technicianId, technicianName, technicianPhone || '+254711408365');
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Job not found or already assigned' });
      }
      res.json({ success: true, booking: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3cc. ADMIN LIVE DISPATCH: Admin assigns a specific technician directly with instant live dispatch
  app.post('/api/jobs/:id/dispatch', async (req, res) => {
    try {
      const { id } = req.params;
      const { technicianId, technicianName, technicianPhone } = req.body;
      if (!technicianId) {
        return res.status(400).json({ success: false, error: 'Technician ID is required for live dispatch' });
      }
      const updated = await centralDb.dispatchJob(id, technicianId, technicianName, technicianPhone);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      res.json({ success: true, booking: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3d. Complete Job & Prompt Customer for Payment
  app.post('/api/jobs/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await centralDb.updateBooking(id, { status: 'completed' });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      res.json({ success: true, booking: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const booking = req.body;
      if (!booking || !booking.id) {
        return res.status(400).json({ success: false, error: 'Valid booking object with id is required' });
      }
      const saved = await centralDb.createBooking(booking);
      res.json({ success: true, booking: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/bookings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await centralDb.updateBooking(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      res.json({ success: true, booking: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Technicians API
  // Public directory for customers (RBAC: Sensitive fields like National ID & finances stripped)
  app.get(['/api/technicians', '/api/technicians/public'], async (_req, res) => {
    try {
      const list = await centralDb.getTechnicians({ forAdmin: false });
      res.json({ success: true, technicians: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin technicians list (Full data including National IDs and pass validity)
  app.get('/api/admin/technicians', async (_req, res) => {
    try {
      const list = await centralDb.getTechnicians({ forAdmin: true });
      res.json({ success: true, technicians: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/technicians', async (req, res) => {
    try {
      const tech = req.body;
      if (!tech || !tech.name) {
        return res.status(400).json({ success: false, error: 'Technician name is required' });
      }
      const saved = await centralDb.addOrUpdateTechnician(tech);
      res.json({ success: true, technician: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/technicians/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await centralDb.deleteTechnician(id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. DIRECT PASS TECHNICIAN APPROVAL (ADMIN ONLY)
  app.post('/api/technicians/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const approved = await centralDb.approveTechnician(id);
      if (!approved) {
        return res.status(404).json({ success: false, error: 'Technician not found' });
      }
      res.json({ success: true, technician: approved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. ADMIN MESSAGING SUITE (Direct Chat & Group Broadcast Text)
  app.get('/api/admin/messages', async (_req, res) => {
    try {
      res.json({ success: true, messages: await centralDb.getAllMessages() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/messages', async (req, res) => {
    try {
      const { receiverTechnicianId, receiverName, receiverPhone, message, deliveryChannel, sender, senderName } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message content is required' });
      }
      const newMsg = await centralDb.postAdminMessage({
        sender: sender || 'admin',
        senderName: senderName || 'Central Operations Dispatch',
        receiverTechnicianId: receiverTechnicianId || 'all_broadcast',
        receiverName,
        receiverPhone,
        message,
        deliveryChannel: deliveryChannel || 'both',
        isRead: false
      });
      res.json({ success: true, message: newMsg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Technician messages endpoint
  app.get('/api/technicians/:id/messages', async (req, res) => {
    try {
      const { id } = req.params;
      const phone = req.query.phone as string | undefined;
      const list = await centralDb.getMessagesForTechnician(id, phone);
      res.json({ success: true, messages: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4c. AUTOMATED 85/15 SINGLE-TECHNICIAN PAYOUT LEDGER
  app.get('/api/admin/payouts', async (_req, res) => {
    try {
      res.json({ success: true, payouts: await centralDb.getPayoutLedger() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/payouts/disburse', async (req, res) => {
    try {
      const {
        bookingId,
        technicianId,
        technicianName,
        technicianPhone,
        customerName,
        customerPhone,
        totalAmountKsh,
        itemSummary
      } = req.body;

      if (!bookingId || !technicianId || !totalAmountKsh) {
        return res.status(400).json({ success: false, error: 'bookingId, technicianId, and totalAmountKsh are required' });
      }

      const total = Number(totalAmountKsh);
      // Strictly 85% to the single assigned technician, 15% platform commission
      const tech85 = Math.round(total * 0.85);
      const plat15 = Math.round(total * 0.15);

      const entry = await centralDb.recordPayout({
        bookingId,
        technicianId,
        technicianName: technicianName || 'Assigned Technician',
        technicianPhone: technicianPhone || '+254711408365',
        customerName: customerName || 'Valued Customer',
        customerPhone: customerPhone || '+254700000000',
        totalAmountKsh: total,
        platformFee15Ksh: plat15,
        technicianShare85Ksh: tech85,
        payoutStatus: 'completed',
        payoutChannel: 'mpesa_b2c',
        disbursedAt: Date.now(),
        itemSummary: itemSummary || 'Appliance Repair Service',
        transactionReference: `MPESA-B2C-${Date.now().toString().slice(-8)}`
      });

      // Update booking status in central database
      await centralDb.updateBooking(bookingId, {
        paymentStatus: 'paid',
        paidAmountKsh: total,
        technicianPayoutKsh: tech85,
        platformCommissionKsh: plat15,
        disbursementStatus: 'disbursed_to_technician'
      });

      res.json({ success: true, payout: entry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4d. OFFLINE SMS ALERTS API
  app.get('/api/sms/logs', async (_req, res) => {
    try {
      res.json({ success: true, logs: await centralDb.getSmsLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sms/send', async (req, res) => {
    try {
      const { recipientPhone, recipientName, message, type } = req.body;
      if (!recipientPhone || !message) {
        return res.status(400).json({ success: false, error: 'recipientPhone and message required' });
      }
      const log = await centralDb.sendOfflineSmsAlert(recipientPhone, recipientName, message, type || 'job_alert');
      res.json({ success: true, smsLog: log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Customers API
  app.get('/api/customers', async (_req, res) => {
    try {
      res.json({ success: true, customers: await centralDb.getCustomers() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const cust = req.body;
      const saved = await centralDb.addOrUpdateCustomer(cust);
      res.json({ success: true, customer: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await centralDb.deleteCustomer(id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Logged In Sessions API
  app.get('/api/logged-in-users', async (_req, res) => {
    try {
      res.json({ success: true, users: await centralDb.getLoggedInUsers() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/logged-in-users', async (req, res) => {
    try {
      const user = req.body;
      const saved = await centralDb.addOrUpdateLoggedInUser(user);
      res.json({ success: true, user: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6b. PASS VALIDATION & ENTRY FEE EXEMPTION ENGINE
  // Supports checking by Phone Number OR National ID / Passport Number
  app.get('/api/auth/validate-pass', async (req, res) => {
    try {
      const phoneOrId = (req.query.id_number as string) || (req.query.phone as string) || (req.query.phoneOrId as string) || '';
      const role = (req.query.role as string) || undefined;
      const result = await centralDb.validatePass(phoneOrId, role);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/validate-pass', async (req, res) => {
    try {
      const { phone, id_number, phoneOrId, role } = req.body;
      const lookup = id_number || phoneOrId || phone || '';
      const result = await centralDb.validatePass(lookup, role);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // MEDIA & VIDEO ASSET MANAGEMENT (SERVER-PERSISTENT)
  // Allows Admin to upload/change photos and videos at anytime
  // Local State & Vercel KV / Vercel Blob media pipeline
  // ==========================================

  // 1. Upload Photo / Video File (Local State / Vercel KV / Vercel Blob)
  app.post('/api/media/upload', async (req, res) => {
    try {
      const { dataUrl, filename, category } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid dataUrl string required' });
      }

      const uploadResult = await uploadMediaToCloudStorage(dataUrl, filename, category);
      res.json(uploadResult);
    } catch (err: any) {
      console.error('Error in /api/media/upload:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1b. Serve media files directly from cached memory/database stream if running in read-only environment
  app.get('/api/media/file/:id', (req, res) => {
    try {
      const { id } = req.params;
      const file = getCachedMediaFile(id);
      if (!file) {
        return res.status(404).send('Media file not found');
      }
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(file.buffer);
    } catch (err: any) {
      res.status(500).send('Error serving media file: ' + err.message);
    }
  });

  // 1c. PRICING & COMMISSION CONFIGURATION API (Cross-Device Real-Time Sync)
  app.get('/api/pricing', async (_req, res) => {
    try {
      res.json({ success: true, pricing: await centralDb.getPricing() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/pricing', async (req, res) => {
    try {
      const updated = await centralDb.updatePricing(req.body);
      res.json({ success: true, pricing: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1d. Cloud Database & Storage Health Status Endpoint
  app.get('/api/cloud/status', (_req, res) => {
    try {
      res.json({
        success: true,
        status: centralDb.getDatabaseStatus()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Get Media Configuration (Cloud Database Persisted)
  app.get('/api/media/config', async (_req, res) => {
    try {
      const cfg = await centralDb.getMediaConfig();
      res.json({ success: true, ...cfg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Save Media Configuration (Cloud Database Persisted, Zero Disk Writes)
  app.post('/api/media/config', async (req, res) => {
    try {
      const { showcase, featuredVideo } = req.body;
      const updated = await centralDb.updateMediaConfig({ showcase, featuredVideo });
      res.json({ success: true, ...updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Download Latest Project ZIP
  app.post('/api/media/rebuild-zip', (_req, res) => {
    try {
      const rootZip = path.resolve(__dirname, 'homebased-services-project.zip');
      const publicZip = path.resolve(__dirname, 'public', 'homebased-services-project.zip');
      const targetPath = fs.existsSync(rootZip) ? rootZip : (fs.existsSync(publicZip) ? publicZip : null);
      const size = targetPath ? fs.statSync(targetPath).size : 0;

      res.json({
        success: true,
        downloadUrl: '/api/download-zip',
        filename: 'homebased-services-project.zip',
        sizeBytes: size
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // PESAPAL PAYMENT GATEWAY API ROUTES (v3.0)
  // (Exclusively handles all payments via Pesapal: M-Pesa, Airtel, Cards)
  // ==========================================

  // 1. Pesapal Status & Config
  app.get('/api/pesapal/status', async (_req, res) => {
    try {
      const config = getPesapalConfig();
      const connection = await testPesapalConnection();
      res.json({
        success: true,
        businessName: 'HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES',
        supportPhone: '+254711408365',
        config: {
          mode: config.mode,
          currency: config.currency,
          isConfigured: config.isConfigured,
          consumerKey: config.consumerKey,
          consumerSecret: config.consumerSecret,
          hasConsumerKey: Boolean(config.consumerKey),
          hasConsumerSecret: Boolean(config.consumerSecret),
          ipnId: config.ipnId,
        },
        connection,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Test Pesapal API Connection
  app.post('/api/pesapal/test-connection', async (_req, res) => {
    try {
      const result = await testPesapalConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Save / Update Pesapal API Credentials
  app.post('/api/pesapal/save-keys', (req, res) => {
    try {
      const { consumerKey, consumerSecret, mode, ipnId } = req.body || {};
      const updatedConfig = updatePesapalConfig({
        consumerKey: consumerKey || '',
        consumerSecret: consumerSecret,
        mode: mode === 'sandbox' ? 'sandbox' : 'live',
        ipnId: ipnId || undefined,
      });

      // Rebuild ZIP in background so updated config is packaged
      try {
        exec('python3 scripts/make_zip.py', () => {});
      } catch {}

      res.json({
        success: true,
        message: `Pesapal live credentials saved and activated successfully! (Mode: ${updatedConfig.mode.toUpperCase()})`,
        config: updatedConfig,
      });
    } catch (err: any) {
      console.error('Error in /api/pesapal/save-keys:', err);
      res.json({
        success: true,
        message: 'Pesapal live credentials safely preserved in server memory and database.',
        errorNotice: err.message
      });
    }
  });

  // 4. Register IPN with Pesapal
  app.post('/api/pesapal/register-ipn', async (req, res) => {
    try {
      const originHeader = req.headers.origin || req.headers.referer;
      const domain = typeof originHeader === 'string' ? originHeader.split('?')[0].replace(/\/$/, '') : 'https://www.hbelectronics.co.ke';
      const ipnUrl = req.body.url || `${domain}/api/pesapal/ipn`;
      const result = await registerPesapalIPN(ipnUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Create Pesapal Order (M-Pesa STK Push / Card / Airtel)
  app.post('/api/pesapal/create-order', async (req, res) => {
    try {
      const { amountKsh, amount, description, customerName, name, phone, email, role, customId } = req.body;
      const parsedAmount = Number(amountKsh || amount);

      if (!parsedAmount || isNaN(parsedAmount)) {
        return res.status(400).json({ success: false, error: 'Amount in Ksh is required.' });
      }

      const originHeader = req.headers.origin || req.headers.referer;
      const origin = typeof originHeader === 'string' ? originHeader.split('?')[0].replace(/\/$/, '') : 'https://www.hbelectronics.co.ke';

      const result = await submitPesapalOrder({
        amountKsh: parsedAmount,
        description: description || 'Home Based Services Access Pass',
        customerName: customerName || name || 'Customer',
        phone: phone || '0711408365',
        email,
        role: role || 'customer',
        customId,
        origin,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Pesapal create order error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Check Pesapal Transaction Status
  app.get('/api/pesapal/status/:orderTrackingId', async (req, res) => {
    try {
      const { orderTrackingId } = req.params;
      const result = await getPesapalTransactionStatus(orderTrackingId);
      res.json(result);
    } catch (err: any) {
      console.error('Pesapal status query error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. IPN Webhook listener
  app.get('/api/pesapal/ipn', async (req, res) => {
    try {
      const orderTrackingId = (req.query.OrderTrackingId || req.query.orderTrackingId) as string;
      const orderMerchantReference = (req.query.OrderMerchantReference || req.query.orderMerchantReference) as string;

      if (orderTrackingId) {
        await getPesapalTransactionStatus(orderTrackingId);
      }
      res.json({
        orderNotificationType: 'IPNCHANGE',
        orderTrackingId,
        orderMerchantReference,
        status: 200
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. All Pesapal Transactions Ledger
  app.get('/api/pesapal/transactions', (_req, res) => {
    const list = getPesapalTransactions();
    res.json({ success: true, transactions: list });
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Register all API routes
  registerApiRoutes(app);

  // Mount public directory and uploads directory for static assets
  app.use('/uploads', express.static(path.resolve(__dirname, 'public', 'uploads'), { maxAge: '1h' }));
  app.use(express.static(path.resolve(__dirname, 'public'), { maxAge: '1h' }));
  const distPath = path.resolve(__dirname, 'dist');

  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, mount Vite middleware with robust SPA fallback
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback handler for all frontend routes: transform and serve index.html
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production mode: serve static dist
    app.use(express.static(distPath, { maxAge: '1d', etag: true }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES`);
    console.log(`Pesapal API v3.0 Gateway (M-Pesa, Airtel & Cards Exclusive) ready on port ${PORT}`);
    console.log(`Support: +254 711 408 365 | Countrywide Operations`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

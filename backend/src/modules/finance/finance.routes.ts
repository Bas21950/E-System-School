import { Router } from 'express';
import multer from 'multer';
import * as feeController from './fee.controller';
import * as paymentController from './payment.controller';
import * as paymentMethodController from './paymentMethod.controller';
import * as discountController from './discount.controller';
import * as billingController from './billing.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Payment Methods
router.get('/payment-methods', paymentMethodController.getPaymentMethods);
router.post('/payment-methods', paymentMethodController.createPaymentMethod);
router.put('/payment-methods/:id', paymentMethodController.updatePaymentMethod);

// Fee Plans
router.get('/fee-plans', feeController.getFeePlans);
router.post('/fee-plans', feeController.createFeePlan);
router.delete('/fee-plans/:id', feeController.deleteFeePlan);
router.get('/fee-plans/:id/assignments', feeController.getFeeAssignments);
router.post('/fee-plans/:id/assignments', feeController.assignFeeToStudent);
router.delete('/fee-plans/:feePlanId/assignments/:studentId', feeController.unassignFeeFromStudent);

router.get('/receipt-types', feeController.getReceiptTypes);
router.post('/receipt-types', feeController.createReceiptType);
router.put('/receipt-types/:id', feeController.updateReceiptType);
router.delete('/receipt-types/:id', feeController.deleteReceiptType);

router.post('/fees/generate', feeController.generateFees);
router.post('/fees/generate-room', feeController.generateFeesByRoom);
router.post('/fees/individual', feeController.createIndividualFee);
router.get('/reports/arrears', feeController.getArrearsReport);

// Monthly special-class rosters and explicit bulk billing
router.post('/billing/monthly/roster/prepare', billingController.prepareMonthlyRoster);
router.put('/billing/monthly/roster/members/:studentId', billingController.updateMonthlyRosterMember);
router.post('/billing/monthly/preview', billingController.previewMonthlyBilling);
router.post('/billing/monthly/post', billingController.postMonthlyBilling);

// Receipts PDF
router.get('/receipts/:id/pdf', paymentController.generateReceiptPdf);
router.get('/receipts/generate', paymentController.generateReceiptPdf);

// Receipt Settings
router.get('/receipt-settings', paymentController.getReceiptSettings);
router.put('/receipt-settings', paymentController.updateReceiptSettings);
router.post('/receipt-settings/logo', upload.single('file'), paymentController.uploadReceiptLogo);

// Student Fees
router.get('/students/:studentId/fees', feeController.getStudentFees);
router.get('/students/:studentId/discounts', discountController.getStudentDiscounts);
router.post('/students/:studentId/discounts', discountController.createStudentDiscount);
router.put('/discounts/:id', discountController.updateStudentDiscount);
router.delete('/discounts/:id', discountController.deleteStudentDiscount);

// Payments
router.post('/payments', paymentController.processPayment);
router.get('/payments/latest', paymentController.getLatestPayments);
router.get('/payments/receipt/:receiptNo', paymentController.getPaymentByReceiptNo);
router.get('/payments/:id', paymentController.getPaymentDetail);
router.delete('/payments/:id', paymentController.deletePayment);
router.get('/students/:studentId/payments', paymentController.getStudentPayments);
router.get('/dashboard/stats', paymentController.getDashboardStats);

// Student Fees Management
router.put('/fees/:id', feeController.updateStudentFee);
router.delete('/fees/:id', feeController.deleteStudentFee);
router.get('/fees/rooms/:roomId/balances', feeController.getRoomBalances);

// Transfer Slip Upload & Retrieval
router.post('/payments/:id/slip', paymentController.uploadTransferSlip);
router.get('/payments/:id/slip-url', paymentController.getPaymentSlipUrl);

export default router;

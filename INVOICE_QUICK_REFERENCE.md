# Invoice System - Quick Reference Card

## API Endpoints (All require admin JWT token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices (supports filtering) |
| GET | `/api/invoices/stats` | Get invoice statistics |
| GET | `/api/invoices/:id` | Get single invoice |
| POST | `/api/invoices` | Create new invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/invoices/:id/pdf` | Download PDF |

## Quick Create Invoice Example

```javascript
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "client": {
    "name": "Acme Corp",
    "email": "billing@acme.com"
  },
  "dueDate": "2025-02-28",
  "lineItems": [
    {
      "description": "Website Development",
      "quantity": 1,
      "rate": 5000
    }
  ],
  "tax": { "rate": 5 }
}
```

## Invoice Statuses

- `draft` - Not sent yet
- `sent` - Delivered to client
- `paid` - Payment received
- `overdue` - Past due (auto-set)
- `cancelled` - Voided

## Invoice Number Format

`INV-2025-0001` (auto-generated, sequential per year)

## Required Fields

**Minimum:**
- `client.name`
- `client.email`
- `dueDate`
- `lineItems` (at least 1 item with description, quantity, rate)

## Auto-Calculated Fields

DON'T send these - they're calculated automatically:
- `lineItems[].amount` (qty × rate)
- `subtotal` (sum of line items)
- `tax.amount` ((subtotal × tax.rate) / 100)
- `total` (subtotal + tax.amount)
- `invoiceNumber` (auto-generated)

## Filter Examples

```
GET /api/invoices?status=paid
GET /api/invoices?status=overdue
GET /api/invoices?clientEmail=acme.com
GET /api/invoices?startDate=2025-01-01&endDate=2025-01-31
GET /api/invoices?sortBy=dueDate&order=asc
```

## PDF Download (Frontend)

```javascript
const downloadPDF = async (invoiceId, invoiceNumber) => {
  const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceNumber}.pdf`;
  a.click();
};
```

## Files Created

- `server/models/Invoice.js` - Model definition
- `server/routes/invoices.js` - Route handlers
- `server/routes/INVOICE_API.md` - Full documentation
- `server/scripts/testInvoiceSystem.js` - Test script
- `server/server.js` - Updated with invoice routes

## Package Installed

- `pdfkit@0.17.2` - PDF generation library

## Testing

```bash
# Test with curl (replace TOKEN and values)
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client":{"name":"Test","email":"test@test.com"},"dueDate":"2025-02-28","lineItems":[{"description":"Test","quantity":1,"rate":100}]}'
```

## Common Patterns

### Create Draft Invoice
```javascript
{ ..., "status": "draft" }
```

### Mark as Sent
```javascript
PUT /api/invoices/:id
{ "status": "sent" }
```

### Mark as Paid
```javascript
PUT /api/invoices/:id
{ "status": "paid" }
```

### Link to Project
```javascript
{ ..., "projectId": "507f1f77bcf86cd799439012" }
```

### Add Tax (5% GST)
```javascript
{ ..., "tax": { "rate": 5 } }
```

### No Tax
```javascript
// Just omit tax field or:
{ ..., "tax": { "rate": 0 } }
```

---

**Full Documentation:** See `INVOICE_SYSTEM_SUMMARY.md` and `server/routes/INVOICE_API.md`

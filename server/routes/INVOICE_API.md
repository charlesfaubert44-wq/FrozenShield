# Invoice API Documentation

## Overview
Complete invoice management system for FrozenShield admin backend with PDF generation capabilities.

## Authentication
All routes require admin authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. List All Invoices
**GET** `/api/invoices`

Get all invoices with optional filtering and sorting.

**Query Parameters:**
- `status` (optional): Filter by status (draft, sent, paid, overdue, cancelled)
- `startDate` (optional): Filter by issue date start (ISO date string)
- `endDate` (optional): Filter by issue date end (ISO date string)
- `clientEmail` (optional): Filter by client email (case-insensitive partial match)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `order` (optional): Sort order - 'asc' or 'desc' (default: desc)

**Example Request:**
```bash
GET /api/invoices?status=paid&sortBy=dueDate&order=asc
```

**Example Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "invoiceNumber": "INV-2025-0001",
      "client": {
        "name": "Acme Corporation",
        "email": "billing@acme.com",
        "phone": "867-555-0100",
        "address": {
          "street": "123 Main Street",
          "city": "Yellowknife",
          "province": "NT",
          "postalCode": "X1A 1A1",
          "country": "Canada"
        }
      },
      "issueDate": "2025-01-15T00:00:00.000Z",
      "dueDate": "2025-02-14T00:00:00.000Z",
      "lineItems": [
        {
          "description": "Website Development",
          "quantity": 1,
          "rate": 5000,
          "amount": 5000
        }
      ],
      "subtotal": 5000,
      "tax": {
        "rate": 5,
        "amount": 250
      },
      "total": 5250,
      "status": "paid",
      "notes": "Payment received via e-transfer",
      "terms": "Payment is due within 30 days of invoice date.",
      "projectId": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Corporate Website Redesign",
        "description": "Modern responsive website"
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Invoice Statistics
**GET** `/api/invoices/stats`

Get aggregated statistics about invoices.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      { "_id": "paid", "count": 5, "totalAmount": 25000 },
      { "_id": "sent", "count": 3, "totalAmount": 15000 },
      { "_id": "draft", "count": 2, "totalAmount": 8000 }
    ],
    "totalInvoices": 10,
    "totalRevenue": 25000,
    "overdueCount": 1
  }
}
```

---

### 3. Get Single Invoice
**GET** `/api/invoices/:id`

Get detailed information about a specific invoice.

**URL Parameters:**
- `id`: Invoice MongoDB ObjectId

**Example Request:**
```bash
GET /api/invoices/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "invoiceNumber": "INV-2025-0001",
    "client": { /* client details */ },
    "issueDate": "2025-01-15T00:00:00.000Z",
    "dueDate": "2025-02-14T00:00:00.000Z",
    "lineItems": [ /* line items */ ],
    "subtotal": 5000,
    "tax": { "rate": 5, "amount": 250 },
    "total": 5250,
    "status": "paid",
    "notes": "",
    "terms": "Payment is due within 30 days of invoice date.",
    "projectId": { /* populated project */ },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Create New Invoice
**POST** `/api/invoices`

Create a new invoice with auto-generated invoice number.

**Request Body:**
```json
{
  "client": {
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "867-555-0100",
    "address": {
      "street": "123 Main Street",
      "city": "Yellowknife",
      "province": "NT",
      "postalCode": "X1A 1A1",
      "country": "Canada"
    }
  },
  "issueDate": "2025-01-15",
  "dueDate": "2025-02-14",
  "lineItems": [
    {
      "description": "Website Development - Homepage Design",
      "quantity": 1,
      "rate": 2000
    },
    {
      "description": "Website Development - Contact Form",
      "quantity": 1,
      "rate": 500
    }
  ],
  "tax": {
    "rate": 5
  },
  "notes": "Thank you for your business!",
  "terms": "Payment is due within 30 days of invoice date. Late payments may incur additional fees.",
  "projectId": "507f1f77bcf86cd799439012",
  "status": "draft"
}
```

**Required Fields:**
- `client.name`
- `client.email`
- `dueDate`
- `lineItems` (array with at least one item)

**Optional Fields:**
- `client.phone`
- `client.address.*`
- `issueDate` (defaults to current date)
- `tax.rate` (defaults to 0)
- `notes`
- `terms` (has default value)
- `projectId`
- `status` (defaults to 'draft')

**Line Item Fields:**
- `description` (required)
- `quantity` (required, must be > 0)
- `rate` (required, must be >= 0)
- `amount` (auto-calculated: quantity × rate)

**Example Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "invoiceNumber": "INV-2025-0001",
    /* ... full invoice object ... */
  }
}
```

---

### 5. Update Invoice
**PUT** `/api/invoices/:id`

Update an existing invoice. Only provided fields will be updated.

**URL Parameters:**
- `id`: Invoice MongoDB ObjectId

**Request Body:** (all fields optional, only include what you want to update)
```json
{
  "status": "sent",
  "notes": "Sent to client via email on 2025-01-16"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    /* ... updated invoice object ... */
  }
}
```

---

### 6. Delete Invoice
**DELETE** `/api/invoices/:id`

Permanently delete an invoice.

**URL Parameters:**
- `id`: Invoice MongoDB ObjectId

**Example Response:**
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

---

### 7. Generate and Download PDF
**GET** `/api/invoices/:id/pdf`

Generate a professional PDF invoice and download it.

**URL Parameters:**
- `id`: Invoice MongoDB ObjectId

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="invoice-INV-2025-0001.pdf"`
- Binary PDF data

**Example Request:**
```bash
GET /api/invoices/507f1f77bcf86cd799439011/pdf
```

**PDF Features:**
- Professional FrozenShield branding
- Company information (logo area, contact details)
- Invoice number and status badge
- Client billing information
- Issue date, due date, and project reference
- Itemized line items table with alternating row colors
- Subtotal, tax, and total calculations
- Notes and terms & conditions sections
- Professional footer

---

## Invoice Statuses

| Status | Description |
|--------|-------------|
| `draft` | Invoice created but not sent to client |
| `sent` | Invoice has been sent to client |
| `paid` | Invoice has been paid |
| `overdue` | Invoice is past due date and unpaid (auto-set) |
| `cancelled` | Invoice has been cancelled |

**Note:** The system automatically updates status from `sent` to `overdue` when fetching an invoice that is past its due date.

---

## Invoice Number Format

Invoice numbers are automatically generated in the format: `INV-YYYY-NNNN`

- `INV`: Prefix
- `YYYY`: Current year
- `NNNN`: Sequential number (padded with zeros)

Examples:
- `INV-2025-0001`
- `INV-2025-0002`
- `INV-2025-0100`

Numbers reset each year and are guaranteed to be unique.

---

## Automatic Calculations

The system automatically calculates:

1. **Line Item Amounts**: `quantity × rate = amount`
2. **Subtotal**: Sum of all line item amounts
3. **Tax Amount**: `(subtotal × tax.rate) / 100`
4. **Total**: `subtotal + tax.amount`

You don't need to provide these calculated values in requests.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors, missing required fields)
- `401` - Unauthorized (missing or invalid JWT token)
- `404` - Not Found (invoice or related resource not found)
- `500` - Internal Server Error

---

## Example Usage in Frontend

### Fetch All Invoices
```javascript
const response = await fetch('/api/invoices', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { success, data } = await response.json();
```

### Create Invoice
```javascript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client: {
      name: 'Client Name',
      email: 'client@example.com'
    },
    dueDate: '2025-02-28',
    lineItems: [
      {
        description: 'Service Description',
        quantity: 1,
        rate: 1000
      }
    ]
  })
});
const { success, data } = await response.json();
```

### Download PDF
```javascript
const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `invoice-${invoiceNumber}.pdf`;
a.click();
```

### Update Invoice Status
```javascript
const response = await fetch(`/api/invoices/${invoiceId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'paid'
  })
});
const { success, data } = await response.json();
```

---

## Database Schema

### Invoice Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| invoiceNumber | String | Yes | Auto-generated unique identifier |
| client.name | String | Yes | Client's full name or company name |
| client.email | String | Yes | Client's email address |
| client.phone | String | No | Client's phone number |
| client.address.* | String | No | Client's address components |
| issueDate | Date | Yes | When invoice was issued (default: now) |
| dueDate | Date | Yes | Payment due date |
| lineItems | Array | Yes | Array of line item objects (min 1) |
| lineItems[].description | String | Yes | Item description |
| lineItems[].quantity | Number | Yes | Item quantity (min 0) |
| lineItems[].rate | Number | Yes | Item rate/price (min 0) |
| lineItems[].amount | Number | Yes | Auto-calculated (qty × rate) |
| subtotal | Number | Yes | Auto-calculated sum of line items |
| tax.rate | Number | No | Tax percentage (default: 0) |
| tax.amount | Number | No | Auto-calculated tax amount |
| total | Number | Yes | Auto-calculated total |
| status | String | Yes | Invoice status (default: 'draft') |
| notes | String | No | Additional notes for invoice |
| terms | String | No | Payment terms and conditions |
| projectId | ObjectId | No | Reference to related project |
| createdAt | Date | Yes | Auto-set on creation |
| updatedAt | Date | Yes | Auto-updated on save |

---

## Integration Notes

1. **Authentication Required**: All routes require the same JWT authentication used for projects and other admin features.

2. **Project Integration**: Invoices can be linked to projects via `projectId`. The project details are automatically populated in responses.

3. **Automatic Status Updates**: The system automatically updates invoice status to 'overdue' when fetching invoices past their due date.

4. **PDF Generation**: Uses PDFKit library. PDFs include FrozenShield branding and professional formatting.

5. **Validation**: Comprehensive validation on all inputs with helpful error messages.

6. **Indexes**: Database indexes on invoiceNumber, status, dueDate, client.email, and createdAt for optimal query performance.

---

## Testing the API

Use tools like Postman, Insomnia, or curl to test the API:

```bash
# Get auth token first (using existing auth endpoint)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Create an invoice
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client": {
      "name": "Test Client",
      "email": "test@example.com"
    },
    "dueDate": "2025-02-28",
    "lineItems": [
      {
        "description": "Web Development",
        "quantity": 1,
        "rate": 1000
      }
    ]
  }'

# Get all invoices
curl -X GET http://localhost:5000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download PDF
curl -X GET http://localhost:5000/api/invoices/INVOICE_ID/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o invoice.pdf
```

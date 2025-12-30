const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Line item description is required'],
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 1
    },
    rate: {
        type: Number,
        required: [true, 'Rate is required'],
        min: [0, 'Rate cannot be negative']
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    }
}, { _id: true });

// Calculate amount before validation
lineItemSchema.pre('validate', function(next) {
    this.amount = this.quantity * this.rate;
    next();
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    client: {
        name: {
            type: String,
            required: [true, 'Client name is required'],
            trim: true,
            maxlength: [200, 'Client name cannot be more than 200 characters']
        },
        email: {
            type: String,
            required: [true, 'Client email is required'],
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [50, 'Phone number cannot be more than 50 characters']
        },
        address: {
            street: {
                type: String,
                trim: true
            },
            city: {
                type: String,
                trim: true
            },
            province: {
                type: String,
                trim: true
            },
            postalCode: {
                type: String,
                trim: true
            },
            country: {
                type: String,
                trim: true,
                default: 'Canada'
            }
        }
    },
    issueDate: {
        type: Date,
        required: [true, 'Issue date is required'],
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    lineItems: {
        type: [lineItemSchema],
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'At least one line item is required'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative'],
        default: 0
    },
    tax: {
        rate: {
            type: Number,
            min: [0, 'Tax rate cannot be negative'],
            max: [100, 'Tax rate cannot exceed 100%'],
            default: 0
        },
        amount: {
            type: Number,
            min: [0, 'Tax amount cannot be negative'],
            default: 0
        }
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative'],
        default: 0
    },
    status: {
        type: String,
        enum: {
            values: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'draft'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Notes cannot be more than 2000 characters']
    },
    terms: {
        type: String,
        trim: true,
        maxlength: [2000, 'Terms cannot be more than 2000 characters'],
        default: 'Payment is due within 30 days of invoice date. Late payments may incur additional fees.'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ 'client.email': 1 });
invoiceSchema.index({ createdAt: -1 });

// Calculate totals before validation
invoiceSchema.pre('validate', function(next) {
    // Calculate subtotal from line items
    if (this.lineItems && this.lineItems.length > 0) {
        this.subtotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
    }

    // Calculate tax amount
    if (this.tax && this.tax.rate) {
        this.tax.amount = (this.subtotal * this.tax.rate) / 100;
    }

    // Calculate total
    this.total = this.subtotal + (this.tax.amount || 0);

    next();
});

// Update the updatedAt timestamp before saving
invoiceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to generate unique invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    // Find the latest invoice for the current year
    const latestInvoice = await this.findOne({
        invoiceNumber: new RegExp(`^${prefix}`)
    }).sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (latestInvoice) {
        const lastNumber = parseInt(latestInvoice.invoiceNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
    }

    // Pad with zeros (e.g., INV-2025-0001)
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Method to check if invoice is overdue
invoiceSchema.methods.isOverdue = function() {
    return this.status !== 'paid' &&
           this.status !== 'cancelled' &&
           this.dueDate < new Date();
};

// Virtual for formatted invoice number
invoiceSchema.virtual('formattedInvoiceNumber').get(function() {
    return this.invoiceNumber;
});

// Virtual for days until due
invoiceSchema.virtual('daysUntilDue').get(function() {
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

module.exports = mongoose.model('Invoice', invoiceSchema);

const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// @route   GET /api/invoices
// @desc    Get all invoices with filtering and sorting
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        const { status, startDate, endDate, clientEmail, sortBy, order } = req.query;

        // Build query filter
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (clientEmail) {
            filter['client.email'] = new RegExp(clientEmail, 'i');
        }

        if (startDate || endDate) {
            filter.issueDate = {};
            if (startDate) {
                filter.issueDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.issueDate.$lte = new Date(endDate);
            }
        }

        // Build sort options
        const sortOptions = {};
        const sortField = sortBy || 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;
        sortOptions[sortField] = sortOrder;

        const invoices = await Invoice.find(filter)
            .populate('projectId', 'title description')
            .sort(sortOptions);

        res.json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoices',
            error: error.message
        });
    }
});

// @route   GET /api/invoices/stats
// @desc    Get invoice statistics
// @access  Private (Admin only)
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' }
                }
            }
        ]);

        const totalInvoices = await Invoice.countDocuments();
        const totalRevenue = await Invoice.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const overdueInvoices = await Invoice.countDocuments({
            status: { $nin: ['paid', 'cancelled'] },
            dueDate: { $lt: new Date() }
        });

        res.json({
            success: true,
            data: {
                byStatus: stats,
                totalInvoices,
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                overdueCount: overdueInvoices
            }
        });
    } catch (error) {
        console.error('Get invoice stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice statistics',
            error: error.message
        });
    }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private (Admin only)
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('projectId', 'title description projectUrl');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check if invoice is overdue and update status if needed
        if (invoice.isOverdue() && invoice.status === 'sent') {
            invoice.status = 'overdue';
            await invoice.save();
        }

        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error.message
        });
    }
});

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
    try {
        const {
            client,
            issueDate,
            dueDate,
            lineItems,
            tax,
            notes,
            terms,
            projectId,
            status
        } = req.body;

        // Validation
        if (!client || !client.name || !client.email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide client name and email'
            });
        }

        if (!lineItems || lineItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one line item'
            });
        }

        if (!dueDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a due date'
            });
        }

        // Verify project exists if projectId is provided
        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
        }

        // Generate unique invoice number
        const invoiceNumber = await Invoice.generateInvoiceNumber();

        const invoice = new Invoice({
            invoiceNumber,
            client,
            issueDate: issueDate || Date.now(),
            dueDate,
            lineItems,
            tax: tax || { rate: 0, amount: 0 },
            notes,
            terms,
            projectId,
            status: status || 'draft'
        });

        await invoice.save();

        // Populate project details if available
        if (projectId) {
            await invoice.populate('projectId', 'title description projectUrl');
        }

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create invoice',
            error: error.message
        });
    }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            client,
            issueDate,
            dueDate,
            lineItems,
            tax,
            notes,
            terms,
            projectId,
            status
        } = req.body;

        // Verify project exists if projectId is provided
        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
        }

        const updateData = {
            updatedAt: Date.now()
        };

        // Only update provided fields
        if (client) updateData.client = client;
        if (issueDate) updateData.issueDate = issueDate;
        if (dueDate) updateData.dueDate = dueDate;
        if (lineItems) updateData.lineItems = lineItems;
        if (tax !== undefined) updateData.tax = tax;
        if (notes !== undefined) updateData.notes = notes;
        if (terms !== undefined) updateData.terms = terms;
        if (projectId !== undefined) updateData.projectId = projectId;
        if (status) updateData.status = status;

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('projectId', 'title description projectUrl');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            message: 'Invoice updated successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update invoice',
            error: error.message
        });
    }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete invoice',
            error: error.message
        });
    }
});

// @route   GET /api/invoices/:id/pdf
// @desc    Generate and download invoice PDF
// @access  Private (Admin only)
router.get('/:id/pdf', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('projectId', 'title description');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Create PDF document
        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 50
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

        // Pipe the PDF to the response
        doc.pipe(res);

        // Company branding - Header
        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor('#1a1a1a')
            .text('FROZEN SHIELD', 50, 50);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text('Studio', 50, 80);

        // Company details
        doc.fontSize(9)
            .fillColor('#666666')
            .text('FrozenShield Studio', 50, 110)
            .text('hello@frozenshield.ca', 50, 123)
            .text('www.frozenshield.ca', 50, 136);

        // Invoice title and number
        doc.fontSize(24)
            .font('Helvetica-Bold')
            .fillColor('#1a1a1a')
            .text('INVOICE', 400, 50, { align: 'right' });

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text(invoice.invoiceNumber, 400, 80, { align: 'right' });

        // Status badge
        const statusColors = {
            draft: '#95a5a6',
            sent: '#3498db',
            paid: '#27ae60',
            overdue: '#e74c3c',
            cancelled: '#7f8c8d'
        };

        const statusX = 400;
        const statusY = 100;
        doc.roundedRect(statusX, statusY, 162, 20, 3)
            .fillAndStroke(statusColors[invoice.status], statusColors[invoice.status]);

        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(invoice.status.toUpperCase(), statusX, statusY + 6, { width: 162, align: 'center' });

        // Divider line
        doc.strokeColor('#e0e0e0')
            .lineWidth(1)
            .moveTo(50, 170)
            .lineTo(562, 170)
            .stroke();

        // Bill To section
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#1a1a1a')
            .text('BILL TO:', 50, 190);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#333333')
            .text(invoice.client.name, 50, 210);

        if (invoice.client.email) {
            doc.text(invoice.client.email, 50, 223);
        }

        if (invoice.client.phone) {
            doc.text(invoice.client.phone, 50, 236);
        }

        // Client address
        let addressY = 249;
        if (invoice.client.address && invoice.client.address.street) {
            doc.text(invoice.client.address.street, 50, addressY);
            addressY += 13;

            const cityLine = [
                invoice.client.address.city,
                invoice.client.address.province,
                invoice.client.address.postalCode
            ].filter(Boolean).join(', ');

            if (cityLine) {
                doc.text(cityLine, 50, addressY);
                addressY += 13;
            }

            if (invoice.client.address.country) {
                doc.text(invoice.client.address.country, 50, addressY);
            }
        }

        // Invoice details
        const detailsX = 350;
        let detailsY = 190;

        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#666666')
            .text('ISSUE DATE:', detailsX, detailsY)
            .font('Helvetica')
            .fillColor('#333333')
            .text(new Date(invoice.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }), detailsX + 80, detailsY);

        detailsY += 20;
        doc.font('Helvetica-Bold')
            .fillColor('#666666')
            .text('DUE DATE:', detailsX, detailsY)
            .font('Helvetica')
            .fillColor('#333333')
            .text(new Date(invoice.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }), detailsX + 80, detailsY);

        if (invoice.projectId) {
            detailsY += 20;
            doc.font('Helvetica-Bold')
                .fillColor('#666666')
                .text('PROJECT:', detailsX, detailsY)
                .font('Helvetica')
                .fillColor('#333333')
                .text(invoice.projectId.title, detailsX + 80, detailsY, {
                    width: 180,
                    ellipsis: true
                });
        }

        // Line items table
        const tableTop = 340;
        const itemX = 50;
        const qtyX = 340;
        const rateX = 410;
        const amountX = 490;

        // Table header
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#ffffff');

        doc.roundedRect(50, tableTop, 512, 25, 0)
            .fill('#1a1a1a');

        doc.text('DESCRIPTION', itemX + 10, tableTop + 8)
            .text('QTY', qtyX, tableTop + 8)
            .text('RATE', rateX, tableTop + 8)
            .text('AMOUNT', amountX, tableTop + 8);

        // Table rows
        let currentY = tableTop + 35;
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#333333');

        invoice.lineItems.forEach((item, index) => {
            const isEven = index % 2 === 0;
            if (isEven) {
                doc.rect(50, currentY - 5, 512, 25)
                    .fill('#f8f9fa');
            }

            doc.fillColor('#333333')
                .text(item.description, itemX + 10, currentY, { width: 280 })
                .text(item.quantity.toString(), qtyX, currentY)
                .text(`$${item.rate.toFixed(2)}`, rateX, currentY)
                .text(`$${item.amount.toFixed(2)}`, amountX, currentY);

            currentY += 25;
        });

        // Totals section
        currentY += 20;
        const totalsX = 400;

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#666666')
            .text('Subtotal:', totalsX, currentY)
            .fillColor('#333333')
            .text(`$${invoice.subtotal.toFixed(2)}`, amountX, currentY);

        if (invoice.tax && invoice.tax.rate > 0) {
            currentY += 20;
            doc.fillColor('#666666')
                .text(`Tax (${invoice.tax.rate}%):`, totalsX, currentY)
                .fillColor('#333333')
                .text(`$${invoice.tax.amount.toFixed(2)}`, amountX, currentY);
        }

        currentY += 25;
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#1a1a1a')
            .text('TOTAL:', totalsX, currentY)
            .text(`$${invoice.total.toFixed(2)}`, amountX, currentY);

        // Notes section
        if (invoice.notes) {
            currentY += 50;
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#1a1a1a')
                .text('NOTES:', 50, currentY);

            currentY += 15;
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#666666')
                .text(invoice.notes, 50, currentY, { width: 512 });

            currentY += doc.heightOfString(invoice.notes, { width: 512 }) + 5;
        }

        // Terms & Conditions
        if (invoice.terms) {
            currentY += 20;
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#1a1a1a')
                .text('TERMS & CONDITIONS:', 50, currentY);

            currentY += 15;
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#666666')
                .text(invoice.terms, 50, currentY, { width: 512 });
        }

        // Footer
        const footerY = 720;
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#999999')
            .text('Thank you for your business!', 50, footerY, {
                width: 512,
                align: 'center'
            });

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
});

module.exports = router;

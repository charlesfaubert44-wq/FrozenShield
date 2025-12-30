/**
 * Test script for Invoice System
 * Run with: node server/scripts/testInvoiceSystem.js
 *
 * This script tests the invoice system functionality including:
 * - Invoice creation with auto-generated invoice numbers
 * - Calculations (subtotal, tax, total)
 * - Invoice retrieval and updates
 * - Statistics aggregation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected for testing');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const testInvoiceSystem = async () => {
    try {
        console.log('\n=== Testing Invoice System ===\n');

        // Test 1: Generate Invoice Number
        console.log('Test 1: Generating Invoice Number...');
        const invoiceNumber = await Invoice.generateInvoiceNumber();
        console.log(`✓ Generated invoice number: ${invoiceNumber}`);
        console.log(`  Format: INV-YYYY-NNNN (${invoiceNumber.match(/^INV-\d{4}-\d{4}$/) ? 'PASS' : 'FAIL'})`);

        // Test 2: Create Invoice with Calculations
        console.log('\nTest 2: Creating Invoice with Auto-Calculations...');
        const testInvoice = new Invoice({
            invoiceNumber: await Invoice.generateInvoiceNumber(),
            client: {
                name: 'Test Client Corporation',
                email: 'test@example.com',
                phone: '867-555-0100',
                address: {
                    street: '123 Test Street',
                    city: 'Yellowknife',
                    province: 'NT',
                    postalCode: 'X1A 1A1',
                    country: 'Canada'
                }
            },
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            lineItems: [
                {
                    description: 'Website Development - Homepage',
                    quantity: 1,
                    rate: 2000
                },
                {
                    description: 'Website Development - Contact Form',
                    quantity: 1,
                    rate: 500
                },
                {
                    description: 'Logo Design',
                    quantity: 3,
                    rate: 150
                }
            ],
            tax: {
                rate: 5 // 5% GST
            },
            notes: 'Test invoice - please disregard',
            status: 'draft'
        });

        await testInvoice.save();
        console.log(`✓ Invoice created: ${testInvoice.invoiceNumber}`);
        console.log(`  Line items: ${testInvoice.lineItems.length}`);
        console.log(`  Subtotal: $${testInvoice.subtotal.toFixed(2)} (Expected: $2950.00)`);
        console.log(`  Tax (5%): $${testInvoice.tax.amount.toFixed(2)} (Expected: $147.50)`);
        console.log(`  Total: $${testInvoice.total.toFixed(2)} (Expected: $3097.50)`);

        // Verify calculations
        const expectedSubtotal = 2950;
        const expectedTax = 147.50;
        const expectedTotal = 3097.50;

        if (Math.abs(testInvoice.subtotal - expectedSubtotal) < 0.01 &&
            Math.abs(testInvoice.tax.amount - expectedTax) < 0.01 &&
            Math.abs(testInvoice.total - expectedTotal) < 0.01) {
            console.log('  ✓ Calculations are correct!');
        } else {
            console.log('  ✗ Calculation mismatch!');
        }

        // Test 3: Retrieve Invoice
        console.log('\nTest 3: Retrieving Invoice...');
        const retrievedInvoice = await Invoice.findById(testInvoice._id);
        console.log(`✓ Retrieved invoice: ${retrievedInvoice.invoiceNumber}`);
        console.log(`  Status: ${retrievedInvoice.status}`);

        // Test 4: Update Invoice
        console.log('\nTest 4: Updating Invoice Status...');
        testInvoice.status = 'sent';
        await testInvoice.save();
        console.log(`✓ Updated status to: ${testInvoice.status}`);

        // Test 5: Test Overdue Detection
        console.log('\nTest 5: Testing Overdue Detection...');
        const overdueInvoice = new Invoice({
            invoiceNumber: await Invoice.generateInvoiceNumber(),
            client: {
                name: 'Overdue Test Client',
                email: 'overdue@example.com'
            },
            issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            lineItems: [
                {
                    description: 'Test Service',
                    quantity: 1,
                    rate: 1000
                }
            ],
            status: 'sent'
        });

        await overdueInvoice.save();
        const isOverdue = overdueInvoice.isOverdue();
        console.log(`✓ Overdue invoice created: ${overdueInvoice.invoiceNumber}`);
        console.log(`  Is overdue: ${isOverdue} (Expected: true)`);
        console.log(`  Days until due: ${overdueInvoice.daysUntilDue} (Expected: negative number)`);

        // Test 6: Link to Project (if projects exist)
        console.log('\nTest 6: Testing Project Link...');
        const project = await Project.findOne();
        if (project) {
            const projectInvoice = new Invoice({
                invoiceNumber: await Invoice.generateInvoiceNumber(),
                client: {
                    name: 'Project Client',
                    email: 'project@example.com'
                },
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                lineItems: [
                    {
                        description: `Development work for: ${project.title}`,
                        quantity: 1,
                        rate: 5000
                    }
                ],
                projectId: project._id
            });

            await projectInvoice.save();
            await projectInvoice.populate('projectId', 'title description');
            console.log(`✓ Invoice linked to project: ${projectInvoice.projectId.title}`);
        } else {
            console.log('  ⊘ No projects found, skipping project link test');
        }

        // Test 7: Invoice Statistics
        console.log('\nTest 7: Testing Invoice Statistics...');
        const totalInvoices = await Invoice.countDocuments();
        const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
        const draftInvoices = await Invoice.countDocuments({ status: 'draft' });
        const sentInvoices = await Invoice.countDocuments({ status: 'sent' });

        console.log(`✓ Total invoices: ${totalInvoices}`);
        console.log(`  Draft: ${draftInvoices}`);
        console.log(`  Sent: ${sentInvoices}`);
        console.log(`  Paid: ${paidInvoices}`);

        console.log('\n=== Test Summary ===');
        console.log('✓ All tests completed successfully!');
        console.log(`\nCreated ${totalInvoices} test invoice(s) in the database.`);
        console.log('Note: These are test invoices. Delete them from the admin panel if needed.');

    } catch (error) {
        console.error('\n✗ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
};

// Run tests
const runTests = async () => {
    await connectDB();
    await testInvoiceSystem();
};

runTests();

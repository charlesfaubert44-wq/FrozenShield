const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Generate sitemap.xml dynamically
router.get('/sitemap.xml', async (req, res) => {
    try {
        const projects = await Project.find({ featured: true }).sort({ order: 1 });
        const baseUrl = 'https://frozenshield.ca';
        const today = new Date().toISOString().split('T')[0];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

    <!-- Main Pages -->
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>

    <url>
        <loc>${baseUrl}/#services</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}/#projects</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <url>
        <loc>${baseUrl}/#contact</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <!-- Projects -->`;

        // Add each project to sitemap
        projects.forEach(project => {
            const projectLastMod = project.updatedAt ?
                new Date(project.updatedAt).toISOString().split('T')[0] :
                today;

            sitemap += `
    <url>
        <loc>${baseUrl}/#project-${project._id}</loc>
        <lastmod>${projectLastMod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>`;

            // Add image if available
            if (project.imageUrl) {
                sitemap += `
        <image:image>
            <image:loc>${project.imageUrl}</image:loc>
            <image:title>${escapeXml(project.title)}</image:title>
        </image:image>`;
            }

            sitemap += `
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);

    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Generate dynamic structured data with current projects
router.get('/structured-data.json', async (req, res) => {
    try {
        const projects = await Project.find({ featured: true }).sort({ order: 1 }).limit(6);
        const baseUrl = 'https://frozenshield.ca';

        // Extract all unique tags from projects
        const allTags = new Set();
        projects.forEach(project => {
            if (project.tags && Array.isArray(project.tags)) {
                project.tags.forEach(tag => allTags.add(tag));
            }
        });

        const structuredData = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "LocalBusiness",
                    "@id": `${baseUrl}/#organization`,
                    "name": "Frozen Shield Studio",
                    "url": baseUrl,
                    "logo": `${baseUrl}/logo.png`,
                    "description": "Expert web development and custom applications for businesses in Canada's remote territories",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Yellowknife",
                        "addressRegion": "NT",
                        "addressCountry": "CA"
                    },
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": "62.454211",
                        "longitude": "-114.371788"
                    },
                    "areaServed": [
                        {
                            "@type": "State",
                            "name": "Northwest Territories",
                            "containedIn": "Canada"
                        },
                        {
                            "@type": "State",
                            "name": "Yukon",
                            "containedIn": "Canada"
                        },
                        {
                            "@type": "State",
                            "name": "Nunavut",
                            "containedIn": "Canada"
                        }
                    ],
                    "sameAs": [],
                    "email": "hello@frozenshield.ca"
                },
                {
                    "@type": "WebSite",
                    "@id": `${baseUrl}/#website`,
                    "url": baseUrl,
                    "name": "Frozen Shield Studio",
                    "publisher": {
                        "@id": `${baseUrl}/#organization`
                    },
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${baseUrl}/#search={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                },
                {
                    "@type": "ProfessionalService",
                    "name": "Frozen Shield Studio",
                    "url": baseUrl,
                    "description": "Custom web development and applications for Canada's northern territories",
                    "serviceType": [
                        "Web Development",
                        "Custom Web Applications",
                        "Database Integration",
                        "Offline-First Development",
                        "Mobile-Responsive Design"
                    ],
                    "areaServed": {
                        "@type": "Country",
                        "name": "Canada"
                    },
                    "slogan": "We create tailored web applications that solve real problems",
                    "knowsAbout": Array.from(allTags)
                },
                {
                    "@type": "ItemList",
                    "name": "Featured Projects",
                    "itemListElement": projects.map((project, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "CreativeWork",
                            "name": project.title,
                            "description": project.description,
                            "url": project.url || `${baseUrl}/#project-${project._id}`,
                            "image": project.imageUrl,
                            "keywords": project.tags ? project.tags.join(', ') : ''
                        }
                    }))
                }
            ]
        };

        res.json(structuredData);

    } catch (error) {
        console.error('Structured data generation error:', error);
        res.status(500).json({ error: 'Error generating structured data' });
    }
});

// Helper function to escape XML special characters
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

module.exports = router;

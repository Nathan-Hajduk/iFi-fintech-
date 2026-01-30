/**
 * Legal Footer Component
 * Reusable footer with legal links, compliance info, and disclaimers
 */

function createLegalFooter() {
    return `
        <footer class="legal-footer">
            <div class="footer-content">
                <!-- Company Info -->
                <div class="footer-section">
                    <h4>iFi Financial Technologies</h4>
                    <p>Empowering individuals to take control of their financial future through education and intelligent tools.</p>
                    <p style="margin-top: 1rem;">
                        <strong>Email:</strong> support@ifiapp.com<br>
                        <strong>Phone:</strong> 1-800-iFi-HELP (1-800-434-4357)<br>
                        <strong>Location:</strong> Wilmington, DE
                    </p>
                </div>

                <!-- Legal & Compliance -->
                <div class="footer-section">
                    <h4>Legal & Compliance</h4>
                    <ul>
                        <li><a href="${getBasePath()}terms-of-service.html">Terms of Service</a></li>
                        <li><a href="${getBasePath()}privacy-policy.html">Privacy Policy</a></li>
                        <li><a href="${getBasePath()}copyright-policy.html">Copyright & DMCA</a></li>
                        <li><a href="${getBasePath()}contact-us.html">Contact Us</a></li>
                    </ul>
                </div>

                <!-- Resources -->
                <div class="footer-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="${getBasePath()}how-it-works.html">How It Works</a></li>
                        <li><a href="${getBasePath()}features.html">Features</a></li>
                        <li><a href="${getBasePath()}pricing.html">Pricing</a></li>
                    </ul>
                </div>

                <!-- Regulatory Notice -->
                <div class="footer-section">
                    <h4>Regulatory Notice</h4>
                    <p><strong>NOT Financial Advice:</strong> iFi is NOT a registered investment adviser (SEC), broker-dealer (FINRA), or tax professional.</p>
                    <p>All information is educational only. Consult licensed professionals for personalized advice.</p>
                </div>
            </div>

            <div class="footer-disclaimer">
                <p><strong>IMPORTANT DISCLAIMER:</strong> iFi provides educational financial tools and AI-generated insights for informational purposes only. We are NOT a registered investment adviser with the SEC, NOT a broker-dealer registered with FINRA, and NOT a tax or legal advisory service. All content is educational and should not be construed as personalized financial, investment, tax, or legal advice. Always consult with licensed financial advisors, CPAs, and attorneys before making financial decisions. Past performance does not guarantee future results. Investments involve risk including potential loss of principal.</p>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2026 iFi Financial Technologies. All Rights Reserved.</p>
                <div class="footer-legal-links">
                    <a href="${getBasePath()}terms-of-service.html">Terms</a>
                    <a href="${getBasePath()}privacy-policy.html">Privacy</a>
                    <a href="${getBasePath()}copyright-policy.html">Copyright</a>
                    <a href="${getBasePath()}contact-us.html">Contact</a>
                </div>
            </div>
        </footer>
    `;
}

/**
 * Helper to determine base path for links
 * Handles both pre-login (html/) and post-login (html/) pages
 */
function getBasePath() {
    const currentPath = window.location.pathname;
    // If already in html folder or root, use ./
    if (currentPath.includes('/html/') || !currentPath.includes('/')) {
        return './';
    }
    // Otherwise use ../html/
    return '../html/';
}

/**
 * Initialize footer on page load
 * Call this at the end of each HTML file
 */
function initializeLegalFooter() {
    // Check if footer already exists
    if (document.querySelector('.legal-footer')) {
        return;
    }

    // Insert footer before closing body tag
    const footerHTML = createLegalFooter();
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLegalFooter);
} else {
    initializeLegalFooter();
}

/**
 * Navigation Selectors
 * Centralized selectors for navigation components
 */

export const NAV_SELECTORS = {
  // Header Navigation
  header: {
    container: '[data-testid="header"], header',
    logo: '[data-testid="logo-link"]',
    logoFallback: 'a[href="/"]',
    mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',
    mobileMenuToggleFallback: 'button[aria-label*="menu" i], .mobile-menu-button',

    // Main navigation links
    browseLink: '[data-testid="nav-browse-link"]',
    browseLinkFallback: 'nav a:has-text("Find Artisans"), nav a:has-text("Browse")',
    categoriesLink: '[data-testid="nav-categories-link"]',
    categoriesLinkFallback: 'nav a:has-text("Categories")',
    howItWorksLink: '[data-testid="nav-how-it-works-link"]',
    howItWorksLinkFallback: 'nav a:has-text("How It Works")',
    aboutLink: '[data-testid="nav-about-link"]',
    aboutLinkFallback: 'nav a:has-text("About")',
    pricingLink: '[data-testid="nav-pricing-link"]',
    pricingLinkFallback: 'nav a:has-text("Pricing")',

    // Auth links
    signInLink: '[data-testid="nav-sign-in-link"]',
    signInLinkFallback: 'nav a:has-text("Sign In")',
    getStartedLink: '[data-testid="nav-get-started-link"]',
    getStartedLinkFallback: 'nav a:has-text("Get Started")',
  },

  // Footer Navigation
  footer: {
    container: '[data-testid="footer"], footer',

    // Company links
    aboutLink: '[data-testid="footer-about-link"]',
    aboutLinkFallback: 'footer a:has-text("About")',
    contactLink: '[data-testid="footer-contact-link"]',
    contactLinkFallback: 'footer a:has-text("Contact")',
    careersLink: '[data-testid="footer-careers-link"]',
    careersLinkFallback: 'footer a:has-text("Careers")',
    pressLink: '[data-testid="footer-press-link"]',
    pressLinkFallback: 'footer a:has-text("Press")',

    // Legal links
    privacyLink: '[data-testid="footer-privacy-link"]',
    privacyLinkFallback: 'footer a:has-text("Privacy")',
    termsLink: '[data-testid="footer-terms-link"]',
    termsLinkFallback: 'footer a:has-text("Terms")',

    // Trust links
    safetyLink: '[data-testid="footer-safety-link"]',
    safetyLinkFallback: 'footer a:has-text("Safety")',
    insuranceLink: '[data-testid="footer-insurance-link"]',
    insuranceLinkFallback: 'footer a:has-text("Insurance")',
  },

  // Breadcrumbs
  breadcrumbs: {
    container: '[data-testid="breadcrumbs"], nav[aria-label="Breadcrumb"]',
    link: '[data-testid^="breadcrumb-link"]',
    currentPage: '[aria-current="page"]',
  },

  // Sidebar (Dashboard)
  sidebar: {
    container: '[data-testid="sidebar"], aside',
    dashboardLink: '[data-testid="sidebar-dashboard-link"]',
    jobsLink: '[data-testid="sidebar-jobs-link"]',
    bidsLink: '[data-testid="sidebar-bids-link"]',
    projectsLink: '[data-testid="sidebar-projects-link"]',
    paymentsLink: '[data-testid="sidebar-payments-link"]',
    settingsLink: '[data-testid="sidebar-settings-link"]',
  },

  // Mobile Menu
  mobileMenu: {
    overlay: '[data-testid="mobile-menu-overlay"]',
    panel: '[data-testid="mobile-menu-panel"]',
    closeButton: '[data-testid="mobile-menu-close"]',
    closeButtonFallback: 'button[aria-label*="close" i]',
  },
} as const;

/**
 * Navigation accessible role selectors
 */
export const NAV_ROLES = {
  // Navigation regions
  mainNavigation: { role: 'navigation', name: /main|primary/i },
  footerNavigation: { role: 'navigation', name: /footer/i },
  breadcrumbNavigation: { role: 'navigation', name: /breadcrumb/i },

  // Links
  homeLink: { role: 'link', name: /home|logo/i },
  browseLink: { role: 'link', name: /find artisans|browse/i },
  categoriesLink: { role: 'link', name: /categories/i },
  aboutLink: { role: 'link', name: /about/i },

  // Menu buttons
  menuButton: { role: 'button', name: /menu|navigation/i },
  closeMenuButton: { role: 'button', name: /close/i },
} as const;

/**
 * Navigation URL patterns
 */
export const NAV_URLS = {
  home: '/',
  browse: /\/browse/,
  categories: /\/categories/,
  howItWorks: /\/how-it-works/,
  about: /\/about/,
  contact: /\/contact/,
  pricing: /\/pricing/,
  careers: /\/careers/,
  privacy: /\/privacy/,
  terms: /\/terms/,
  safety: /\/safety/,
  insurance: /\/insurance/,
  press: /\/press/,
  successStories: /\/success-stories/,
  resources: /\/resources/,
} as const;

// MAXRIVEN — site settings. The one place to change where the "Notify me" forms send their sign-ups.
// No API keys here: everything in this file is public.
window.MAXRIVEN_CONFIG = {
  // Address of a form service that accepts a POST with the fields email, consent and product
  // (for example a Formspree or Brevo form endpoint). Empty: the form opens an e-mail to NOTIFY_EMAIL instead.
  NOTIFY_FORM_URL: 'https://formspree.io/f/xgaapnpe',
  NOTIFY_EMAIL: 'maxriven@icloud.com'
};

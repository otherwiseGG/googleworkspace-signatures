/**
 * Gmail Signature Self-Service Setup
 * ------------------------------------
 * A free, self-service way for every user in a Google Workspace
 * organization to set their own Gmail signature — no service account,
 * no domain-wide delegation, no downloadable API keys required.
 *
 * Each user visits the deployed web app once, confirms or fills in their
 * name, an optional nickname, and job title, and the script sets their
 * OWN Gmail signature via the Gmail API using their own OAuth consent.
 * The script never touches anyone else's account.
 *
 * Setup instructions: see README.md
 */

/**
 * ============================================================
 * CONFIGURATION — edit these values for your organization
 * ============================================================
 */
const CONFIG = {
  companyName: 'Your Company',
  tagline: 'Your tagline here',
  websiteUrl: 'https://www.example.com',
  // Leave logoUrl empty to omit the logo entirely.
  // Must be a publicly reachable image URL (a local file path will not work in emails).
  logoUrl: '',
  logoWidth: 140,
  logoHeight: 35,
  // Any number of extra footer lines (company legal form, address, register details, etc.)
  legalLines: [
    'Your Company Legal Form',
    'Street address, postal code, city, country',
  ],
  confidentialityNotice: 'This email and any attachments are confidential and intended solely for the addressee. If you have received this email in error, please notify the sender and delete it from your system.',
  printNotice: 'Please consider the environment before printing this email.',
  colors: {
    text: '#111111',
    accent: '#2563eb',
    divider: '#f59e0b',
    muted: '#6b7280',
    disclaimer: '#9ca3af',
  },
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('form')
    .setTitle(CONFIG.companyName + ' Signature Setup');
}

/**
 * Reads the CURRENT user's own profile (name, job title) via the People API.
 * Only ever reads the signed-in user's own data — no directory-wide access needed.
 */
function getMyProfile() {
  const email = Session.getActiveUser().getEmail();
  let jobTitle = '';
  let firstName = '';
  let lastName = '';
  try {
    const person = People.People.get('people/me', { personFields: 'organizations,names' });
    if (person.organizations && person.organizations.length > 0) {
      jobTitle = person.organizations[0].title || '';
    }
    if (person.names && person.names.length > 0) {
      firstName = person.names[0].givenName || '';
      lastName = person.names[0].familyName || '';
    }
  } catch (err) {
    // People API not available or fields empty; leave blank
  }
  return { email: email, jobTitle: jobTitle, firstName: firstName, lastName: lastName };
}

/**
 * Combines first name, last name and an optional nickname into a display name:
 *  - firstName + lastName + nickname -> `First "Nickname" Last`
 *  - firstName/lastName only         -> `First Last`
 *  - nickname only                   -> `Nickname`
 */
function buildDisplayName(firstName, lastName, nickname) {
  const hasFullName = Boolean(firstName) || Boolean(lastName);
  const hasNickname = Boolean(nickname);

  if (hasFullName && hasNickname) {
    return [firstName, '"' + nickname + '"', lastName].filter(Boolean).join(' ');
  }
  if (hasFullName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  if (hasNickname) {
    return nickname;
  }
  return '';
}

/**
 * Sets the Gmail signature for the CURRENTLY SIGNED-IN user only.
 * Requires the gmail.settings.basic OAuth scope, granted by that user.
 */
function setSignature(firstName, lastName, nickname, jobTitle) {
  const email = Session.getActiveUser().getEmail();
  const displayName = buildDisplayName(firstName, lastName, nickname);

  if (!displayName) {
    throw new Error('Please enter at least your name or your nickname.');
  }

  const html = buildSignatureHtml(displayName, jobTitle);

  const sendAsList = Gmail.Users.Settings.SendAs.list('me');
  const primary = sendAsList.sendAs.find(function (s) { return s.isPrimary; }) || sendAsList.sendAs[0];

  Gmail.Users.Settings.SendAs.patch({ signature: html }, 'me', primary.sendAsEmail);

  return 'Signature updated for ' + email;
}

function buildSignatureHtml(displayName, jobTitle) {
  const c = CONFIG.colors;
  const logo = CONFIG.logoUrl
    ? '<img src="' + CONFIG.logoUrl + '" alt="' + CONFIG.companyName + '" width="' + CONFIG.logoWidth + '" height="' + CONFIG.logoHeight + '" style="display:block;">'
    : '';
  const legal = CONFIG.legalLines.join('<br>');

  return '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ' + c.text + '; line-height: 1.5;">' +
    logo +
    '<div style="margin-top: 10px; font-weight: bold; font-size: 14px;">' + displayName + '</div>' +
    (jobTitle ? '<div style="color: ' + c.accent + ';">' + jobTitle + '</div>' : '') +
    '<div style="margin-top: 8px; border-top: 2px solid ' + c.divider + '; width: 40px;"></div>' +
    '<div style="margin-top: 8px;">' +
      '<strong>' + CONFIG.companyName + '</strong>' + (CONFIG.tagline ? ' — ' + CONFIG.tagline : '') + '<br>' +
      '<a href="' + CONFIG.websiteUrl + '" style="color: ' + c.accent + '; text-decoration: none;">' + CONFIG.websiteUrl.replace(/^https?:\/\//, '') + '</a>' +
    '</div>' +
    (legal ? '<div style="margin-top: 8px; color: ' + c.muted + '; font-size: 11px;">' + legal + '</div>' : '') +
    '<div style="margin-top: 10px; color: ' + c.disclaimer + '; font-size: 10px; line-height: 1.4;">' +
      CONFIG.confidentialityNotice + '<br>' +
      CONFIG.printNotice +
    '</div>' +
  '</div>';
}

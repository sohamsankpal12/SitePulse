/**
 * SitePulse — Unit tests: URL validator (shared/helpers.js)
 */
const { validateUrl } = require('../../backend/shared/helpers');

describe('validateUrl', () => {
  // Valid URLs
  test.each([
    'https://example.com',
    'https://sub.example.com/path?q=1',
    'http://example.com',
    'https://mysite.co.uk',
  ])('accepts valid URL: %s', (url) => {
    const { valid } = validateUrl(url);
    expect(valid).toBe(true);
  });

  // Invalid / blocked URLs
  test.each([
    ['localhost', 'localhost URL'],
    ['http://localhost', 'localhost HTTP'],
    ['http://127.0.0.1', 'loopback'],
    ['http://192.168.1.1', 'private range'],
    ['http://10.0.0.1', 'private class A'],
    ['http://172.16.0.1', 'private class B'],
    ['http://169.254.169.254/latest/meta-data', 'AWS metadata'],
    ['ftp://example.com', 'unsupported protocol'],
    ['not-a-url', 'invalid format'],
  ])('rejects blocked/invalid URL: %s (%s)', (url) => {
    const { valid } = validateUrl(url);
    expect(valid).toBe(false);
  });
});

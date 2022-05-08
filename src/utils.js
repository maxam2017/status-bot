/**
 *
 * @param {string} s
 * @returns {URL | undefined}
 */
function safeCreateHttpsURL(s) {
  try {
    const url = new URL(s);
    if (url.protocol !== 'https:') {
      throw new Error('[safeCreateURL] wrong protocol.');
    }
    return url;
  } catch (e) {
    // no nothing
  }
}

module.exports = {
  safeCreateHttpsURL,
};

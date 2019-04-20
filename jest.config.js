const { defaults } = require('jest-config');
module.exports = {
  testMatch: ['**/?(*.)(spec|test|e2e).js'],
  testURL: 'http://localhost:3000'
  // collectCoverage: true,
};

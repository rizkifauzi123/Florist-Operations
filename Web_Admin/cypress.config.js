const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Required for the reporter to hook into Cypress events
      require('cypress-mochawesome-reporter/plugin')(on);
    },
  },
});
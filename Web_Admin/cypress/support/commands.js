Cypress.Commands.add('login', () => {

  cy.visit('/login')

  // Intercept API
  cy.intercept('GET', '**/api/invoices').as('getInvoices')
  cy.intercept('GET', '**/api/users').as('getUsers')

  // Input login
  cy.get('input[type="email"]').should('be.visible')
    .clear()
    .type('rizkiahmadfauzi1215@gmail.com')

  cy.get('input[type="password"]').should('be.visible')
    .clear()
    .type('fauzi123')

  cy.get('.login-btn').should('be.visible').click()

  // Tunggu API selesai
  cy.wait('@getInvoices', { timeout: 15000 })
  cy.wait('@getUsers', { timeout: 15000 })

  // Validasi redirect (JANGAN pakai contains)
  cy.url({ timeout: 15000 }).should('include', '/dashboard')
})

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.eventflow-navbar')) return

    const frontend = window.location.port === '8081'
        ? 'http://localhost:5173'
        : window.location.origin
    const navbar = document.createElement('header')
    navbar.className = 'eventflow-navbar'

    navbar.innerHTML = `
        <a href="${frontend}/" class="eventflow-brand">
            <span class="eventflow-brand-icon">E</span>
            <span>eventflow</span>
        </a>

        <nav class="eventflow-nav-links">
            <a href="${frontend}/#about">O platformi</a>
            <a href="${frontend}/#features">Kaj ponujamo</a>
        </nav>

        <div class="eventflow-nav-actions">
            <a href="${frontend}/" class="eventflow-home-button">
                ← Začetna stran
            </a>
        </div>
    `

    document.body.prepend(navbar)
})

document.addEventListener('DOMContentLoaded', () => {
    const registrationLink = document.querySelector('#kc-registration a');
    const frontend = window.location.port === '8081'
        ? 'http://localhost:5173'
        : window.location.origin;

    if (registrationLink) {
        registrationLink.href = `${frontend}/?registration=1`;
    }
});

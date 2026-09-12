// Current Date
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('ar-SA', options);
    document.getElementById('current-date').textContent = dateStr;
}
updateDate();

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Search Toggle
const searchToggle = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const closeSearch = document.getElementById('closeSearch');

searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchOverlay.querySelector('input').focus();
});

closeSearch.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
});

// Close search on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchOverlay.classList.remove('active');
        mainNav.classList.remove('active');
    }
});

// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
});

// Newsletter form
document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    if (email) {
        alert('شكراً لاشتراكك! سيتم إرسال النشرة إلى: ' + email);
        e.target.reset();
    }
});

// Smooth active nav on scroll (simple)
const navLinks = document.querySelectorAll('.main-nav a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Close mobile menu
        mainNav.classList.remove('active');
        menuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
    });
});

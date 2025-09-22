//function to select elements
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

//menu toggle
const navToggle = $('.nav-toggle');
const navMenu = $('#primary-nav');

if (navToggle && navMenu) {
    console.log('ici');
    navToggle.addEventListener('click', () => {
        console.log('click');
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navMenu.classList.toggle('show');
    });

    // close menu when clicking a link
    $all('#primary-nav a').forEach(link => {
        link.addEventListener('click', () => {
            console.log('click link');
            navToggle.setAttribute('aria-expanded', false);
            navMenu.classList.remove('show');
        });
    });
}
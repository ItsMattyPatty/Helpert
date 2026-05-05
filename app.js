document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded');
  initializeApp();
});

function initializeApp() {
  attachEventListeners();
  loadContent();
}

function attachEventListeners() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
  });
}

function handleButtonClick(e) {
  console.log('Button clicked:', e.target.textContent);
}

function loadContent() {
  const mainElement = document.querySelector('main');
  if (mainElement) {
    console.log('Main content area found');
  }
}

function showMessage(message) {
  alert(message);
}

function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

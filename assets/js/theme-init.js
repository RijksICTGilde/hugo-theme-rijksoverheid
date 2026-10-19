(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {}
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-scheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
})();

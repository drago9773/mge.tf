const exemptPaths = ['/verify', '/init-openid'];

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});

function setupNavigation() {
  document.body.addEventListener('click', handleLinkClick);
  window.addEventListener('popstate', handlePopState);
}

function handleLinkClick(e) {
  const link = e.target.closest('a');
  if (!link) return;

  const url = new URL(link.href);
  const isSameOrigin = url.origin === window.location.origin;
  const isExemptPath = exemptPaths.some(path => url.pathname.startsWith(path));

  if (isSameOrigin && !isExemptPath) {
    e.preventDefault();
    navigateTo(url.pathname + url.search + url.hash, true);
  }
}

async function navigateTo(url, addToHistory = true) {
  if (document.startViewTransition) {
    await document.startViewTransition(() => updatePage(url, addToHistory)).finished;
  } else {
    await updatePage(url, addToHistory);
  }
}
async function updatePage(url, addToHistory) {
  const response = await fetch(url);
  const html = await response.text();
  const parser = new DOMParser();
  const newDocument = parser.parseFromString(html, 'text/html');

  const mainContent = document.getElementById('main-content');
  const newMainContent = newDocument.getElementById('main-content');
  if (mainContent && newMainContent) {
    mainContent.innerHTML = newMainContent.innerHTML;
    executeScripts(mainContent);
    document.getElementById('dropdown-content').classList.add('hidden');
  }

  document.title = newDocument.title;

  if (addToHistory) {
    window.history.pushState({ url }, '', url);
  }
}

function executeScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach(oldScript => {
    const newScript = document.createElement('script');
    newScript.text = oldScript.text;
    if (oldScript.src) {
      newScript.src = oldScript.src;
    }
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

function handlePopState(event) {
  if (event.state && event.state.url) {
    navigateTo(event.state.url, false);
  }
}
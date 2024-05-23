function openInNewTab(url) {
    window.open(url, '_blank').focus();
}

document.addEventListener("DOMContentLoaded", function() {
    // sidebar logic
    const sidebarTrigger = document.querySelector('.sidebar-trigger');
    const overlay = document.querySelector('.overlay');

    sidebarTrigger.addEventListener('mouseover', function() {
        overlay.style.left = '0';
        sidebarTrigger.style.opacity = '0';
    });

    overlay.addEventListener('mouseleave', function() {
        overlay.style.left = '-200px';
        sidebarTrigger.style.opacity = '1';
    });

    overlay.addEventListener('mouseover', function() {
        sidebarTrigger.style.opacity = '0';
    });

    // tournament links
    document.getElementById("cup3Button").addEventListener("click", function() {
        openInNewTab('https://brackethq.com/b/6lk1b/');
    });
    document.getElementById("cup2Button").addEventListener("click", function() {
        openInNewTab('https://brackethq.com/b/8lovb/');
    });
    document.getElementById("cup1Button").addEventListener("click", function() {
        openInNewTab('https://brackethq.com/b/5qorb/');
    });
    document.getElementById("new1Button").addEventListener("click", function() {
        openInNewTab('https://university.com');
    });
    document.getElementById("new2Button").addEventListener("click", function() {
        openInNewTab('https://university.com');
    });
    document.getElementById("discordInvite").addEventListener("click", function() {
        openInNewTab('discord.gg/j6kDYSpYbs');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('announcement-overlay');
    const closeButton = document.getElementById('closeOverlay');
  
    overlay.style.display = 'block';
  
    closeButton.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  });
  
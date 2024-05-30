document.addEventListener("DOMContentLoaded", function() {
    // sidebar logic
    const sidebarTrigger = document.querySelector('.sidebar-trigger');
    const overlay = document.querySelector('.overlay');
    const tournamentHoverButton = document.querySelector('.tournament-hover-button');

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

    // tournament hover button logic
    tournamentHoverButton.addEventListener('mouseover', function() {
        tournamentHoverButton.style.opacity = '0';
    });

    tournamentHoverButton.addEventListener('mouseleave', function() {
        tournamentHoverButton.style.opacity = '1';
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
    const announcementOverlay = document.getElementById('announcement-overlay');
    const closeButton = document.getElementById('closeOverlay');
  
    announcementOverlay.style.display = 'block';
  
    closeButton.addEventListener('click', function() {
        announcementOverlay.style.display = 'none';
    });
});

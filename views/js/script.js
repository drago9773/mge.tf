function initializeEventListeners() {
    const sidebarTrigger = document.querySelector('.sidebar-trigger');
    const overlay = document.querySelector('.overlay');
    const tournamentTrigger = document.querySelector('.tournament-hover-button');
    const newsOverlay = document.querySelector('.tournaments-overlay');

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

    tournamentTrigger.addEventListener('mouseover', function() {
        newsOverlay.style.right = '0';
        tournamentTrigger.style.right = '-200px';
    });

    newsOverlay.addEventListener('mouseleave', function() {
        newsOverlay.style.right = '-340px';
        tournamentTrigger.style.right = '0';
    });
    document.getElementById('cup3Button').addEventListener('click', function() {
        window.open('https://brackethq.com/b/6lk1b/');
    });
    document.getElementById('cup2Button').addEventListener('click', function() {
        window.open('https://brackethq.com/b/8lovb/');
    });
    document.getElementById('cup1Button').addEventListener('click', function() {
        window.open('https://brackethq.com/b/5qorb/');
    });

    document.getElementById('discordInvite').addEventListener('click', function() {
        window.open('discord.gg/j6kDYSpYbs');
    });
    
    document.getElementById('2v2cup').addEventListener('click', function() {
        window.open('https://mge.tf/2v2cup');
    });

    let seen = localStorage.getItem('popupSeen');
    const announcementOverlay = document.getElementById('announcement-overlay');
    const closeButton = document.getElementById('closeOverlay');

    if (!seen && announcementOverlay) {
        announcementOverlay.style.display = 'block';
        localStorage.setItem('popupSeen', 'true');
    }

    if (closeButton) {
        closeButton.addEventListener('click', function() {
            announcementOverlay.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeEventListeners);
document.body.addEventListener('htmx:historyRestore', () => {
    console.log('Settled');
    initializeEventListeners();
});

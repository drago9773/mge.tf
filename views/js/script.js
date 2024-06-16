document.addEventListener('DOMContentLoaded', function() {
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
        tournamentTrigger.style.opacity = '0';
    });

    newsOverlay.addEventListener('mouseleave', function() {
        newsOverlay.style.right = '-340px';
        tournamentTrigger.style.opacity = '1';
    });
    newsOverlay.addEventListener('mouseover', function() {
        tournamentTrigger.style.opacity = '0';
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
    document.getElementById('new1Button').addEventListener('click', function() {
        window.open('https://university.com');
    });
    document.getElementById('new2Button').addEventListener('click', function() {
        window.open('https://university.com');
    });
    document
        .getElementById('discordInvite')
        .addEventListener('click', function() {
            window.open('discord.gg/j6kDYSpYbs');
        });
});

document.addEventListener('DOMContentLoaded', () => {
    let seen = localStorage.getItem('popupSeen');
    const announcementOverlay = document.getElementById('announcement-overlay');
    const closeButton = document.getElementById('closeOverlay');

    if (!seen) {
        announcementOverlay.style.display = 'block';
        localStorage.setItem('popupSeen', 'true');
    }

    closeButton.addEventListener('click', function() {
        announcementOverlay.style.display = 'none';
    });
});

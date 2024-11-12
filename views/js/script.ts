function initializeEventListeners() {
    const tournamentTrigger = document.querySelector('.tournament-hover-button') as HTMLElement;
    const newsOverlay = document.querySelector('.tournaments-overlay') as HTMLElement;
    if (tournamentTrigger && newsOverlay) {
        tournamentTrigger.addEventListener('mouseover', function () {
            newsOverlay.style.right = '0';
            tournamentTrigger.style.right = '-200px';
        });

        newsOverlay.addEventListener('mouseleave', function () {
            newsOverlay.style.right = '-340px';
            tournamentTrigger.style.right = '0';
        });
    }

    document.getElementById('cup3Button')?.addEventListener('click', function () {
        window.open('https://brackethq.com/b/6lk1b/');
    });
    document.getElementById('cup2Button')?.addEventListener('click', function () {
        window.open('https://brackethq.com/b/8lovb/');
    });
    document.getElementById('cup1Button')?.addEventListener('click', function () {
        window.open('https://brackethq.com/b/5qorb/');
    });

    document.getElementById('discordInvite')?.addEventListener('click', function () {
        window.open('discord.gg/j6kDYSpYbs');
    });

    document.getElementById('2v2cup')?.addEventListener('click', function () {
        window.open('https://mge.tf/2v2cup');
    });

    let seen = localStorage.getItem('popupSeen');
    const announcementOverlay = document.getElementById('announcement-overlay');
    const closeButton = document.getElementById('closeOverlay');

    if (!seen && announcementOverlay) {
        announcementOverlay.style.display = 'block';
        localStorage.setItem('popupSeen', 'true');
    }

    if (closeButton && announcementOverlay) {
        closeButton.addEventListener('click', function () {
            announcementOverlay.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeEventListeners);
document.body.addEventListener('htmx:historyRestore', () => {
    console.log('Settled');
    initializeEventListeners();
});

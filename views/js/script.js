function openInNewTab(url) {
    window.open(url, '_blank').focus();
}

document.addEventListener("DOMContentLoaded", function() {
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

function filterUsers() {
    const input = document.getElementById('userSearch');
    let filter = input.value.toLowerCase();
    let users = document.getElementById('users_container').children;

    for (let i = 0; i < users.length; i++) {
        const username = users[i].querySelector('#users_username');
        const steamId = users[i].querySelector('#users_steam_id');
        if (!username && !steamId) continue;
        const usernameTxt = username.textContent || username.innerText;
        const steamIdTxt = steamId.textContent || steamId.innerText;

        if (usernameTxt.toLowerCase().indexOf(filter) > -1 || steamIdTxt.indexOf(filter) > -1) {
            users[i].style.display = '';
        } else {
            users[i].style.display = 'none';
        }
    }
}
document.getElementById('userSearch').addEventListener('input', function () {
    filterUsers();
});

function filterUsers() {
    var input, filter, usersDisplay, users, username, steamId, i, usernameTxt, steamIdTxt;
    input = document.getElementById('userSearch');
    filter = input.value.toLowerCase();
    usersDisplay = document.getElementsByClassName('users_display')[0];
    users = usersDisplay.getElementsByClassName('users_container');

    for (i = 0; i < users.length; i++) {
        username = users[i].getElementsByClassName('users_username')[0];
        steamId = users[i].getElementsByClassName('users_steam_id')[0];
        usernameTxt = username.textContent || username.innerText;
        steamIdTxt = steamId.textContent || steamId.innerText;

        if (usernameTxt.toLowerCase().indexOf(filter) > -1 || steamIdTxt.indexOf(filter) > -1) {
            users[i].style.display = '';
        } else {
            users[i].style.display = 'none';
        }
    }
}
document.getElementById('userSearch').addEventListener('input', function() {
    filterUsers();
});

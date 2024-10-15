function filterTeams() {
    const input = document.getElementById('teamSearch');
    let filter = input.value.toLowerCase();
    let teams = document.getElementById('teams_container').children;

    for (let i = 0; i < teams.length; i++) {
        const name = teams[i].querySelector('#teams_name');
        if (!name) continue;
        const nameTxt = name.textContent || name.innerText;

        if (nameTxt.toLowerCase().indexOf(filter) > -1) {
            teams[i].style.display = '';
        } else {
            teams[i].style.display = 'none';
        }
    }
}
document.getElementById('teamSearch').addEventListener('input', function () {
    filterTeams();
});

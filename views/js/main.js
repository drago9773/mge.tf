function filterUsers() {
    let input = /** @type {HTMLInputElement | null } */ document.getElementById('eloSearch');
    if (input === null) {
        return;
    }
    let filter = input.value.toLowerCase();
    let table = document.getElementById('eloTableBody');
    if (table == null) {
        return;
    }
    let rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        let nameCell = rows[i].getElementsByTagName('td')[1];
        let steamCell = rows[i].getElementsByTagName('td')[4];
        let nameTxt = nameCell.textContent || nameCell.innerText;

        if (nameTxt.toLowerCase().includes(filter.toLowerCase()) || steamCell.innerText.includes(filter)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

document.getElementById('eloSearch')?.addEventListener('input', function () {
    filterUsers();
});

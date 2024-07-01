function filterUsers() {
    let input = document.getElementById('eloSearch');
    let filter = input.value.toLowerCase();
    let table = document.getElementById('eloTableBody');
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

document.getElementById('eloSearch')?.addEventListener('input', function() {
    filterUsers();
});

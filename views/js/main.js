function filterUsers() {
    var input, filter, table, rows, nameCell, steamIdCell, i, nameTxt, steamIdTxt;
    input = document.getElementById('eloSearch');
    filter = input.value.toLowerCase();
    table = document.getElementById('eloTableBody');
    rows = table.getElementsByTagName('tr');

    for (i = 0; i < rows.length; i++) {
        nameCell = rows[i].getElementsByClassName('name-column')[0];
        steamIdCell = rows[i].getAttribute('hx-get').split("=")[1].split("?")[0];
        nameTxt = nameCell.textContent || nameCell.innerText;
        
        if (nameTxt.toLowerCase().indexOf(filter) > -1 || steamIdCell.indexOf(filter) > -1) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}

document.getElementById("eloSearch").addEventListener("input", function() {
    filterUsers();
});
document.addEventListener("DOMContentLoaded", function() {
    const button1v1 = document.querySelector('.mm-1v1');
    const button2v2 = document.querySelector('.mm-2v2');
    const overlayBackground = document.querySelector('.button-overlay-background');

    button1v1.addEventListener('mouseover', function() {
        button1v1.style.padding = '120px 100px';
        button1v1.style.backgroundColor = '#850585';
        overlayBackground.style.backgroundColor = 'black';
        overlayBackground.style.zIndex = '1';
    });

    button1v1.addEventListener('mouseleave', function() {
        button1v1.style.padding = '120px 100px';
        button1v1.style.backgroundColor = 'rgb(255, 0, 255)';
        overlayBackground.style.backgroundColor = '';
        overlayBackground.style.zIndex = '0';
    });

    button2v2.addEventListener('mouseover', function() {
        button2v2.style.padding = '120px 100px';
        button2v2.style.backgroundColor = '#850585';
        overlayBackground.style.display = 'block';
        overlayBackground.style.backgroundColor = 'black';
        overlayBackground.style.zIndex = '1';
    });

    button2v2.addEventListener('mouseleave', function() {
        button2v2.style.padding = '120px 100px'; 
        button2v2.style.backgroundColor = 'rgb(255, 0, 255)';
        overlayBackground.style.backgroundColor = ''; 
        overlayBackground.style.zIndex = '0';
    });
});

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
document.addEventListener("DOMContentLoaded", function() {
    const button1v1 = document.querySelector('.mm-1v1');
    const button2v2 = document.querySelector('.mm-2v2');
    const overlayBackground = document.querySelector('.button-overlay-background');

    button1v1.addEventListener('mouseover', function() {
        button1v1.style.padding = '130px 90px';
        button1v1.style.backgroundColor = '#850585';
        overlayBackground.style.backgroundColor = 'black';
        overlayBackground.style.opacity = '1';
        overlayBackground.style.pointerEvents = 'auto';
    });

    button1v1.addEventListener('mouseleave', function() {
        button1v1.style.padding = '130px 90px';
        button1v1.style.backgroundColor = 'rgb(51, 51, 184)';
        overlayBackground.style.backgroundColor = '';
        overlayBackground.style.opacity = '0';
        overlayBackground.style.pointerEvents = 'none';
    });

    button2v2.addEventListener('mouseover', function() {
        button2v2.style.padding = '130px 90px';
        button2v2.style.backgroundColor = '#850585';
        overlayBackground.style.backgroundColor = 'black';
        overlayBackground.style.opacity = '1';
        overlayBackground.style.pointerEvents = 'auto';
    });

    button2v2.addEventListener('mouseleave', function() {
        button2v2.style.padding = '130px 90px';
        button2v2.style.backgroundColor = 'rgb(224, 52, 52)';
        overlayBackground.style.backgroundColor = ''; 
        overlayBackground.style.opacity = '0';
        overlayBackground.style.pointerEvents = 'none';
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

document.addEventListener("DOMContentLoaded", function() {
    const button1v1 = document.querySelector('.mm-1v1');
    const button2v2 = document.querySelector('.mm-2v2');
    
    const createFlames = (button) => {
        const flameContainer = document.createElement('div');
        flameContainer.classList.add('flame-container');
        for (let i = 0; i < 100; i++) {
            const flame = document.createElement('div');
            flame.classList.add('flame');
            flame.style.left = `${i-1}%`;
            flame.style.animationDelay = `${Math.random() * 0.5}s`;
            flame.style.width = `${Math.random() * 10 + 5}px`;
            flame.style.height = `${Math.random() * 30 + 10}px`;
            flameContainer.appendChild(flame);
        }
        button.appendChild(flameContainer);
    };

    createFlames(button1v1);
    createFlames(button2v2);
});

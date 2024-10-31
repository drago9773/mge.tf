document.addEventListener('DOMContentLoaded', function () {
  const openTOSPopup = document.getElementById('openTOSPopup');
  const closeTOSPopup = document.getElementById('closeTOSPopup');
  const tosModal = document.getElementById('TOSpopup');

  openTOSPopup.addEventListener('click', function (event) {
    event.preventDefault(); 
    tosModal.classList.remove('hidden');
  });

  closeTOSPopup.addEventListener('click', function () {
    tosModal.classList.add('hidden');
  });

  window.addEventListener('click', function (event) {
    if (event.target == tosModal) {
      tosModal.classList.add('hidden'); 
    }
  });
});

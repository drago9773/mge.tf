document.addEventListener('DOMContentLoaded', function () {
  const openTOSPopup = document.getElementById('openTOSPopup');
  const closeTOSPopup = document.getElementById('closeTOSPopup');
  const tosModal = document.getElementById('TOSpopup');

  openTOSPopup.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default action (if it was a link)
    tosModal.classList.remove('hidden'); // Show the modal
  });

  // Close the Terms of Service popup
  closeTOSPopup.addEventListener('click', function () {
    tosModal.classList.add('hidden'); // Hide the modal
  });

  // Close modal when clicking outside of it
  window.addEventListener('click', function (event) {
    if (event.target == tosModal) {
      tosModal.classList.add('hidden'); // Hide the modal
    }
  });
});

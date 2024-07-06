function setupEventListeners() {
  const copyServerDiv = document.getElementById('copy-server-id');
  let isDropdownOpen = false;

  document.addEventListener('click', function (event) {
    const dropdownTrigger = event.target.closest('#dropdown-trigger');
    const dropdownContent = document.getElementById('dropdown-content');

    if (dropdownTrigger) {
      event.stopPropagation();
      isDropdownOpen = !isDropdownOpen;
      dropdownContent.classList.toggle('hidden', !isDropdownOpen);
    } else if (isDropdownOpen && !event.target.closest('#dropdown-content')) {
      dropdownContent.classList.add('hidden');
      isDropdownOpen = false;
    }
  });

  document.addEventListener('mouseenter', function (event) {
    if (event.target.closest('#dropdown-trigger')) {
      const dropdownContent = document.getElementById('dropdown-content');
      dropdownContent.classList.remove('hidden');
      isDropdownOpen = true;
    }
  }, true);

  document.addEventListener('mousedown', function (event) {
    if (event.target.closest('#copy-server-id')) {
      navigator.clipboard.writeText('connect mge.tf');
      copyServerDiv.classList.add('text-green-500');
    }
  });

  document.addEventListener('mouseup', function (event) {
    if (event.target.closest('#copy-server-id')) {
      copyServerDiv.classList.remove('text-green-500');
    }
  });
}

document.addEventListener('DOMContentLoaded', setupEventListeners);

window.setupSidebarListeners = setupEventListeners;
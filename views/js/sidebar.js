document.addEventListener('DOMContentLoaded', function() {
  const dropdownTrigger = document.getElementById('dropdown-trigger');
  const dropdownContent = document.getElementById('dropdown-content');
  const copyServerDiv = document.getElementById('copy-server-id');

  copyServerDiv.addEventListener('mousedown', () => {
    navigator.clipboard.writeText('connect mge.tf');
    copyServerDiv.classList.add('text-green-500');
  });

  copyServerDiv.addEventListener('mouseup', () => {
    copyServerDiv.classList.remove('text-green-500');
  });

  if (dropdownTrigger && dropdownContent) {
    let isOpen = false;

    // Function to open dropdown
    function openDropdown() {
      dropdownContent.classList.remove('hidden');
      isOpen = true;
    }

    // Function to close dropdown
    function closeDropdown() {
      dropdownContent.classList.add('hidden');
      isOpen = false;
    }

    // Toggle dropdown on click
    dropdownTrigger.addEventListener('click', function(event) {
      event.stopPropagation();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Open dropdown on hover
    dropdownTrigger.addEventListener('mouseenter', openDropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (isOpen && !dropdownContent.contains(event.target) && event.target !== dropdownTrigger) {
        closeDropdown();
      }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  } else {
    console.error('Dropdown trigger or content not found.');
  }
});
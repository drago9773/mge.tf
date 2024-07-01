document.addEventListener('DOMContentLoaded', function() {
  const dropdownTrigger = document.getElementById('dropdown-trigger');
  const dropdownContent = document.getElementById('dropdown-content');

  if (dropdownTrigger && dropdownContent) {
    // Function to toggle dropdown visibility
    function toggleDropdown() {
      dropdownContent.classList.toggle('hidden');
    }

    // Show dropdown content on SVG click or hover
    dropdownTrigger.addEventListener('click', function() {
      toggleDropdown();
    });

    dropdownTrigger.addEventListener('mouseenter', function() {
      toggleDropdown();
    });

    // Hide dropdown content when mouse leaves trigger and content
    function closeDropdown() {
      if (!dropdownTrigger.matches(':hover') && !dropdownContent.matches(':hover')) {
        dropdownContent.classList.add('hidden');
      }
    }

    dropdownTrigger.addEventListener('mouseleave', function() {
      setTimeout(closeDropdown, 500);
    });

    dropdownContent.addEventListener('mouseleave', function() {
      setTimeout(closeDropdown, 500);
    });
  } else {
    console.error('Dropdown trigger or content not found.');
  }
});

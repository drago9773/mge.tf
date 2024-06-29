document.addEventListener('DOMContentLoaded', function() {
  const dropdownTrigger = document.getElementById('dropdown-trigger');
  const dropdownContent = document.getElementById('dropdown-content');

  // Track whether mouse is over the trigger or content
  let isMouseOver = false;

  // Show dropdown content when hovering over trigger or content
  dropdownTrigger.addEventListener('mouseenter', function() {
    dropdownContent.classList.remove('hidden');
    isMouseOver = true;
  });

  dropdownContent.addEventListener('mouseenter', function() {
    dropdownContent.classList.remove('hidden');
    isMouseOver = true;
  });

  // Hide dropdown content when leaving trigger or content
  dropdownTrigger.addEventListener('mouseleave', function() {
    isMouseOver = false;
    setTimeout(function() {
      if (!isMouseOver) {
        dropdownContent.classList.add('hidden');
      }
    }, 200); // Adjust delay as needed to prevent premature hiding
  });

  dropdownContent.addEventListener('mouseleave', function() {
    isMouseOver = false;
    setTimeout(function() {
      if (!isMouseOver) {
        dropdownContent.classList.add('hidden');
      }
    }, 200); // Adjust delay as needed to prevent premature hiding
  });
});

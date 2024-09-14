document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    // Show the section based on the clicked link
    function showSection(targetId) {
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
    }

    // Add click event listeners to links
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');
            showSection(targetId);
        });
    });

    // Optional: Show the first section by default
    if (sections.length > 0) {
        showSection(sections[0].id);
    }
});

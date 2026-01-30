document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contactForm");
    const formMessage = document.getElementById("formMessage");
    
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                subject: document.getElementById("subject").value,
                message: document.getElementById("message").value
            };
            
            try {
                // TODO: Replace with actual API endpoint when backend is ready
                // For now, show success message
                formMessage.className = "form-message success";
                formMessage.textContent = "Thank you! Your message has been sent successfully. We'll get back to you soon.";
                form.reset();
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = "none";
                }, 5000);
                
            } catch (error) {
                formMessage.className = "form-message error";
                formMessage.textContent = "Sorry, there was an error sending your message. Please try again.";
            }
        });
    }
});

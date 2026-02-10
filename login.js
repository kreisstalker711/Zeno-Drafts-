document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();

        if (username) {
            // In a real app, you'd validate credentials against a server.
            // For this demo, any username is accepted.
            sessionStorage.setItem('zeno-user', username);
            
            // Redirect to the editor page
            window.location.href = 'docs.html';
        }
    });
});
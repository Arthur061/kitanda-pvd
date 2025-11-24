document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('login-page'); 

    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');
    const goToLoginLink = document.getElementById('go-to-login');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = registerForm.username.value;
        const password = registerForm.password.value;
        const confirmPassword = registerForm['confirm-password'].value;
        messageDiv.innerText = '';
        messageDiv.style.color = '#d32f2f'; 

        // Validação no frontend
        if (password.length < 4) {
            messageDiv.innerText = 'A senha deve ter pelo menos 4 caracteres.';
            return;
        }
        if (password !== confirmPassword) {
            messageDiv.innerText = 'As senhas não coincidem.';
            return;
        }

        // Envia os dados para o main.js através da API do preload
        const result = await window.api.register(username, password);

        if (result.success) {
            messageDiv.style.color = '#28a745'; 
            messageDiv.innerText = result.message;
            registerForm.reset();

            setTimeout(() => {
                window.api.goToLogin();
            }, 1500); 

        } else {
            messageDiv.innerText = result.message;
        }
    });

    goToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.api.goToLogin();
    });
});
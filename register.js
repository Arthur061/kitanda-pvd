document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('login-page'); // Reutiliza o fundo da página de login

    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');
    const goToLoginLink = document.getElementById('go-to-login');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = registerForm.username.value;
        const password = registerForm.password.value;
        const confirmPassword = registerForm['confirm-password'].value;
        messageDiv.innerText = '';
        messageDiv.style.color = '#d32f2f'; // Cor de erro padrão

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
            messageDiv.style.color = '#28a745'; // Cor de sucesso
            messageDiv.innerText = result.message;
            registerForm.reset(); // Limpa o formulário
        } else {
            messageDiv.innerText = result.message;
        }
    });

    // Adiciona o evento de clique para voltar ao login
    goToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.api.goToLogin();
    });
});
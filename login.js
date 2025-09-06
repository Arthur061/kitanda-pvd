document.addEventListener('DOMContentLoaded', () => {

    document.body.classList.add('login-page');
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        errorMessageDiv.innerText = '';
        const result = await window.api.login(username, password);
        if (!result.success) {
            errorMessageDiv.innerText = result.message;
        }
    });

    // Adiciona o evento de clique para navegar para a página de registo
    const goToRegisterLink = document.getElementById('go-to-register');
    goToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o comportamento padrão do link
        window.api.goToRegister(); // Chama a função exposta no preload
    });
    
});
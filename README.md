# Kitanda - Sistema de Ponto de Venda (PDV) para Café e Lanches

![Logotipo da Kitanda](assets/logo.png)

O "Kitanda" é um sistema de Ponto de Venda (PDV) de desktop, robusto e intuitivo, desenvolvido para a gestão completa de pequenos estabelecimentos como cafés e lanchonetes. Construído com Electron, o sistema oferece uma interface de utilizador limpa e funcionalidades essenciais que abrangem desde o registo de produtos e controlo de stock até à finalização de vendas e geração de relatórios de gestão.

## 🚀 Funcionalidades Principais

O sistema foi desenhado para ser uma ferramenta completa para o dia a dia do seu negócio:

* **Autenticação Segura**: Ecrãs de login e registo de utilizadores, com senhas encriptadas (usando `bcrypt`) para garantir a segurança dos dados.
* **Controlo de Acesso por Nível**:
    * **Utilizador Padrão**: Acesso ao ecrã principal para realizar vendas e gerir produtos.
    * **Administrador (`admin`)**: Acesso total, incluindo um painel de "Gerenciamento" com relatórios detalhados.
* **Gestão de Produtos Completa**:
    * Adição, edição e exclusão de produtos.
    * Campos para nome, preço, quantidade em stock, categoria e stock mínimo para alertas.
    * Interface dedicada para uma gestão de inventário eficiente e organizada.
* **Frente de Caixa Intuitiva (PDV)**:
    * Visualização de produtos por categorias para agilizar a seleção.
    * Montagem do pedido em tempo real, com cálculo automático do valor total.
    * Opção para remover itens do pedido antes de finalizar a venda.
* **Processo de Venda Flexível**:
    * Modal de pagamento para finalizar a compra.
    * Suporte para múltiplos meios de pagamento: Dinheiro, Pix, Crédito e Débito.
    * Atualização automática do stock dos produtos após cada venda finalizada.
* **Relatórios de Gestão (Acesso Admin)**:
    * **Movimentação de Caixa**: Visualize o relatório de vendas detalhado por data, agrupado por forma de pagamento e com a lista de produtos de cada transação.
    * **Alerta de Stock Baixo**: Um relatório que lista todos os produtos cujo stock atual é igual ou inferior ao stock mínimo definido, facilitando a reposição do inventário.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

* **[Electron](https://www.electronjs.org/)**: Framework para criar aplicações de desktop multiplataforma com JavaScript, HTML e CSS.
* **[Node.js](https://nodejs.org/)**: Ambiente de execução para o JavaScript no backend (processo principal do Electron).
* **[SQLite3](https://www.sqlite.org/index.html)**: Banco de dados relacional leve e baseado em ficheiro, ideal para aplicações de desktop.
* **HTML, CSS, e JavaScript**: Tecnologias padrão da web para a construção da interface do utilizador (processo de renderização do Electron).
* **[Bcrypt.js](https://github.com/kelektiv/node.bcrypt.js)**: Biblioteca para encriptação de senhas.

## ⚙️ Como Começar

Para executar o projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos

Certifique-se de que tem o [Node.js](https://nodejs.org/) instalado. O npm (Node Package Manager) será instalado juntamente com ele.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/arthur061/kitanda-pvd.git](https://github.com/arthur061/kitanda-pvd.git)
    ```
2.  **Navegue até o diretório do projeto:**
    ```bash
    cd kitanda-pvd
    ```
3.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

### Execução

Após a instalação das dependências, pode iniciar a aplicação com o seguinte comando:

```bash
npm start
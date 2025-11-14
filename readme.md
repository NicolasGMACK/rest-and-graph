# Projeto de Demonstração: Design de APIs (REST vs. GraphQL)

Este é um projeto-conceito criado para demonstrar e contrastar os padrões de design de API **REST** e **GraphQL**, além de cobrir os fundamentos de autenticação com **JSON Web Tokens (JWT)**.

O objetivo é simular um backend de uma rede social simples (**"Fakebook"**) e mostrar:

* O problema de "cachoeira" (waterfall) de requisições de uma API REST legada.
* A eficiência de uma API GraphQL para consultas complexas.
* O fluxo básico de autenticação e proteção de rotas com JWT.

Todo o projeto (backend e frontend de demonstração) utiliza chaves e schemas em português para facilitar a compreensão durante a apresentação.

---

## 🚀 Como Rodar o Projeto

Você só precisa do **Node.js** (que já inclui o npm) instalado.

---

## 1. Backend (Servidor)

O servidor é o cérebro do projeto e precisa estar rodando para que as demonstrações funcionem.

```bash
# 1. Clone este repositório
git clone https://github.com/seu-usuario/seu-repositorio.git

# 2. Entre na pasta do projeto
cd seu-repositorio

# 3. Instale as dependências (Express, Apollo, JWT, etc.)
npm install

# 4. Inicie o servidor
node index.js
```

Após rodar `node index.js`, você verá mensagens no terminal confirmando que o servidor está no ar:

```
🚀 Servidor "Fakebook" (PT-BR) no ar!
   (REST)      API REST rodando em http://localhost:4000/rest
   (GraphQL)   API GraphQL rodando em http://localhost:4000/graphql
   (JWT)       Faça POST em http://localhost:4000/login para pegar um token...
```

Mantenha este terminal rodando.

---

## 2. Frontend (Demonstração)

O "frontend" é um único arquivo HTML interativo.

* **Demo REST e JWT:** abra o arquivo `index.html` no navegador.
* **Demo GraphQL:** abra o Apollo Sandbox: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## 📚 Guia da API

O servidor expõe as seguintes rotas para a demonstração:

---

## 1. API REST "Legada" (O Problema)

### `GET /rest/usuarios/:id`

Retorna os dados de um usuário específico.

Exemplo: `/rest/usuarios/1`

### `GET /rest/postagens?idAutor=:id`

Retorna uma lista de postagens de um autor específico.

Exemplo: `/rest/postagens?idAutor=2`

### `GET /rest/comentarios?idPostagem=:id`

Retorna os comentários de uma postagem específica.

Exemplo: `/rest/comentarios?idPostagem=101`

---

## 2. Autenticação (JWT)

### `POST /login`

Autentica um usuário e retorna um token JWT.

Body (JSON):

```json
{ "nome": "Alice" }
```

Retorno:

```json
{ "token": "...", "user": { ... } }
```

### `GET /rest/perfil-protegido`

Uma rota REST protegida.

Requer o header:

```
Authorization: Bearer <seu-token-jwt-aqui>
```

Retorno (Sucesso):

```json
{ "acesso": "permitido", "mensagem": "..." }
```

Retorno (Falha):

```json
{ "auth": false, "mensagem": "Token inválido..." }
```

---

## 3. API GraphQL (A Solução)

### Endpoint único:

`POST /graphql`

Todo o tráfego GraphQL passa por aqui. Use o Apollo Sandbox.

### Exemplo de Query (Consulta Grande):

```graphql
query FeedCompletoDaAlice {
  feedParaUsuario(id: "1") {
    conteudo
    autor {
      nome
    }
    comentarios {
      texto
      autor {
        nome
      }
    }
    curtidas {
      nome
    }
  }
}
```

### Exemplo de Mutation (Ação Segura):

```graphql
mutation CurtirPostagem {
  curtirPostagem(idPostagem: "102") {
    id
    conteudo
    curtidas {
      nome
    }
  }
}
```

> Esta mutation requer o header `Authorization: Bearer <token>` para funcionar.

---

## 🎬 Roteiro de Apresentação Sugerido

### **1. O Problema (REST):**

* Abra o `index.html`.
* Mostre a seção "Endpoints REST Disponíveis".
* Abra o F12 > Aba **Rede (Network)**.
* Clique em **"Iniciar Árvore de Requisições"**.
* Aponte para a *cachoeira* de 13 requisições.
* Mostre a árvore sendo construída e o "Resultado Final Costurado".

### **2. A Solução (GraphQL):**

* Abra o Apollo Sandbox.
* Cole a query *FeedCompletoDaAlice*.
* Clique **Play**. Apenas uma vez.
* Mostre que o retorno é idêntico ao resultado final do REST — porém com **uma única chamada**.

### **3. Segurança (JWT):**

* No Apollo Sandbox: tente a mutation *CurtirPostagem*. Mostre o erro de "Não autorizado".
* No `index.html`: vá até "Demonstração de Segurança (JWT)".
* Clique em **Gerar Token** para "Alice".
* Mostre o token sendo gerado.
* Clique em **Testar Rota** → mostre o sucesso.
* Altere uma letra no token → mostre o erro "Token inválido".

---

## ✔️ Conclusão

Este projeto demonstra claramente:

* As limitações de APIs REST tradicionais.
* O potencial de eficiência do GraphQL.
* A importância do JWT para segurança em APIs modernas.

Use este repositório para estudos, demonstrações ou apresentações técnicas!

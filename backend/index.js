// --- 1. Importações e Configuração Inicial ---
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ApolloServer, gql } = require('apollo-server-express');
const fs = require('fs');

const app = express();
app.use(cors());

const JWT_SECRET = 'minha-chave-secreta-para-o-fakebook';
const PORT = 4000;

// Lendo o db.json (que agora tem chaves em português)
const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));


// --- 2. TÓPICO: API GraphQL "A Solução" (em Português) ---
console.log('Configurando API GraphQL em Português...');

const typeDefs = gql`
  type Usuario {
    id: ID!
    nome: String
    avatar: String
    amigos: [Usuario]
    postagens: [Postagem]
  }
  type Postagem {
    id: ID!
    conteudo: String
    autor: Usuario
    curtidas: [Usuario]
    comentarios: [Comentario]
  }
  type Comentario {
    id: ID!
    texto: String
    autor: Usuario
  }
  type Query {
    usuario(id: ID!): Usuario
    postagem(id: ID!): Postagem
    feedParaUsuario(id: ID!): [Postagem]
  }
  type Mutation {
    curtirPostagem(idPostagem: ID!): Postagem
  }
`;

const resolvers = {
  Query: {
    usuario: (parent, { id }) => db.usuarios.find(u => u.id === id),
    feedParaUsuario: (parent, { id }) => {
      const user = db.usuarios.find(u => u.id === id);
      if (!user) return [];
      return db.postagens.filter(p => user.idsAmigos.includes(p.idAutor));
    },
  },
  Mutation: {
    curtirPostagem: (parent, { idPostagem }, context) => {
      if (!context.user) {
        throw new Error('Não autorizado! Você precisa estar logado para curtir.');
      }
      const post = db.postagens.find(p => p.id === idPostagem);
      if (!post) throw new Error('Postagem não encontrada');
      const userId = context.user.userId;
      if (!post.idsCurtidas.includes(userId)) {
        post.idsCurtidas.push(userId);
      }
      console.log(`Usuário '${context.user.nome}' (ID: ${userId}) curtiu a postagem ${idPostagem}`);
      return post;
    }
  },
  Usuario: {
    amigos: (user) => db.usuarios.filter(u => user.idsAmigos.includes(u.id)),
    postagens: (user) => db.postagens.filter(p => p.idAutor === user.id)
  },
  Postagem: {
    autor: (post) => db.usuarios.find(u => u.id === post.idAutor),
    curtidas: (post) => db.usuarios.filter(u => post.idsCurtidas.includes(u.id)),
    comentarios: (post) => db.comentarios.filter(c => c.idPostagem === post.id)
  },
  Comentario: {
    autor: (comment) => db.comentarios.find(u => u.id === comment.idAutor)
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    if (!token) return {};
    try {
      const user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
      return { user };
    } catch (error) {
      console.warn('Token JWT inválido recebido.');
      return {};
    }
  },
  introspection: true, 
  playground: true, 
});

// --- 3. Função Principal de Inicialização ---
async function startServer() {
  await server.start();
  
  server.applyMiddleware({ app });
  app.use(express.json());

  // --- 4. TÓPICO: Segurança com JWT (Login) ---
  app.post('/login', (req, res) => {
    const { nome } = req.body; 
    const user = db.usuarios.find(u => u.nome.toLowerCase().startsWith(nome.toLowerCase()));
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const token = jwt.sign(
      { userId: user.id, nome: user.nome }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log(`Usuário '${user.nome}' logado. Token gerado.`);
    res.json({ token, user });
  });

  // --- 5. TÓPICO: API REST "O Problema" (Endpoints em Português) ---
  console.log('Registrando endpoints REST em Português...');
  
  // *** MUDANÇA: Endpoint agora é /rest/usuarios/:id ***
  app.get('/rest/usuarios/:id', (req, res) => {
    console.log(`REST: GET /rest/usuarios/${req.params.id}`);
    const user = db.usuarios.find(u => u.id === req.params.id);
    res.json(user);
  });

  // *** MUDANÇA: Endpoint agora é /rest/postagens ***
  app.get('/rest/postagens', (req, res) => {
    // *** MUDANÇA: Query param agora é idAutor ***
    const { idAutor } = req.query; 
    console.log(`REST: GET /rest/postagens?idAutor=${idAutor}`);
    const posts = db.postagens.filter(p => p.idAutor === idAutor);
    res.json(posts);
  });

  // *** MUDANÇA: Endpoint agora é /rest/comentarios ***
  app.get('/rest/comentarios', (req, res) => {
    // *** MUDANÇA: Query param agora é idPostagem ***
    const { idPostagem } = req.query; 
    console.log(`REST: GET /rest/comentarios?idPostagem=${idPostagem}`);
    const comments = db.comentarios.filter(c => c.idPostagem === idPostagem);
    res.json(comments);
  });

  // ... (código do app.get('/rest/comentarios', ...) ...
  
  // --- 5B. ROTA REST PROTEGIDA (NOVIDADE) ---
  
  // Middleware para verificar o "crachá" JWT
  const verificarJWT = (req, res, next) => {
    // Pega o cabeçalho 'Authorization'
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ auth: false, mensagem: 'Nenhum token fornecido.' });
    }

    // O token vem como "Bearer [tokenstring]"
    // Precisamos separar o "Bearer"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ auth: false, mensagem: 'Token mal formatado.' });
    }

    // Verifica se o "crachá" é válido
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ auth: false, mensagem: 'Token inválido ou expirado.' });
      }

      // Se for válido, salva o nome do usuário na requisição
      // para a próxima rota usar
      req.usuarioNome = decoded.nome;
      next(); // Continua para a rota protegida
    });
  };

  // Rota REST que USA o middleware de verificação
  // Só é acessível se o 'verificarJWT' passar
  app.get('/rest/perfil-protegido', verificarJWT, (req, res) => {
    // Se chegamos aqui, o token era válido.
    // O middleware 'verificarJWT' adicionou 'req.usuarioNome'.
    res.json({
      acesso: "permitido",
      mensagem: `Bem-vindo à área secreta, ${req.usuarioNome}!`,
      dadosSecretos: "O GraphQL é realmente muito eficiente."
    });
  });

  // --- 6. Iniciando o Servidor ---
  // ... (resto do seu código app.listen(...) ...)

  
  
  // --- 6. Iniciando o Servidor ---
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor "Fakebook" (PT-BR) no ar!`);
    console.log(`   (REST)      API REST rodando em http://localhost:${PORT}/rest`);
    console.log(`   (GraphQL)   API GraphQL rodando em http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`   (JWT)       Faça POST em http://localhost:${PORT}/login para pegar um token (body: { "nome": "Alice" }).`);
  });
}

startServer();
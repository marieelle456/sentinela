const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ===============================
// CONFIGURAÇÕES
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// FRONTEND
// ===============================

// Se server.js estiver na raiz do projeto:
// projeto/
// ├── server.js
// ├── db.json
// └── frontend/
// ├── index.html
// ├── triagem.html
// ├── medico.html
// └── atendimento.html

const FRONTEND_DIR = path.join(__dirname, "frontend");

app.use(express.static(FRONTEND_DIR));

// ===============================
// BANCO DE DADOS
// ===============================

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {

if (!fs.existsSync(DB_FILE)) {

const bancoInicial = {
  usuarios: [
    {
      usuario: "triagem",
      senha: "123",
      tipo: "triagem"
    },
    {
      usuario: "medico",
      senha: "123",
      tipo: "medico"
    },
    {
      usuario: "atendimento",
      senha: "123",
      tipo: "atendimento"
    }
  ],
  pacientes: [],
  triagens: [],
  consultas: []
};

fs.writeFileSync(
  DB_FILE,
  JSON.stringify(bancoInicial, null, 2)
);

return bancoInicial;


}

try {

const conteudo = fs.readFileSync(
  DB_FILE,
  "utf8"
);

return JSON.parse(conteudo);


} catch (erro) {

console.error(
  "Erro ao ler db.json:",
  erro
);

return {
  usuarios: [],
  pacientes: [],
  triagens: [],
  consultas: []
};


}
}

function writeDB(data) {

try {

fs.writeFileSync(
  DB_FILE,
  JSON.stringify(data, null, 2),
  "utf8"
);

return true;


} catch (erro) {

console.error(
  "Erro ao salvar db.json:",
  erro
);

return false;


}
}

// ===============================
// PÁGINA INICIAL
// ===============================

app.get("/", (req, res) => {

res.sendFile(
path.join(FRONTEND_DIR, "index.html")
);

});

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {

try {

const { usuario, senha } = req.body;

console.log(
  "Tentativa de login:",
  usuario
);

if (!usuario || !senha) {

  return res.status(400).json({
    erro: "Usuário e senha são obrigatórios."
  });

}

const db = readDB();

const user = db.usuarios.find(u =>
  String(u.usuario).trim() === String(usuario).trim() &&
  String(u.senha) === String(senha)
);

if (!user) {

  console.log(
    "Login recusado:",
    usuario
  );

  return res.status(401).json({
    erro: "Usuário ou senha inválidos."
  });

}

console.log(
  "Login autorizado:",
  user.usuario,
  user.tipo
);

res.json({
  usuario: user.usuario,
  tipo: user.tipo
});


} catch (erro) {

console.error(
  "Erro no login:",
  erro
);

res.status(500).json({
  erro: "Erro interno no servidor."
});


}

});

// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {

try {

const db = readDB();

const paciente = {

  id: Date.now(),

  nome: req.body.nome || "",

  cpf: req.body.cpf || "",

  dataNascimento:
    req.body.dataNascimento || "",

  sexo:
    req.body.sexo || "",

  nomeMae:
    req.body.nomeMae || "",

  estadoCivil:
    req.body.estadoCivil || "",

  endereco:
    req.body.endereco || "",

  telefone:
    req.body.telefone || "",

  email:
    req.body.email || "",

  contatoEmergencia:
    req.body.contatoEmergencia || "",

  tipo:
    req.body.tipo || "Particular",

  status: "triagem",

  createdAt:
    new Date().toISOString()

};

if (!Array.isArray(db.pacientes)) {
  db.pacientes = [];
}

db.pacientes.push(paciente);

writeDB(db);

res.json(paciente);


} catch (erro) {

console.error(
  "Erro no atendimento:",
  erro
);

res.status(500).json({
  erro: "Erro ao cadastrar paciente."
});


}

});

// ===============================
// TRIAGEM
// ===============================

app.post("/triagem", (req, res) => {

try {

const db = readDB();

let temperatura =
  Number(req.body.temperatura);

let risco = req.body.risco;

if (temperatura >= 39) {

  risco = "vermelho";

} else if (temperatura >= 38) {

  risco = "amarelo";

} else if (!risco) {

  risco = "verde";

}

const triagem = {

  id: Date.now(),

  nome:
    req.body.nome || "",

  sintoma:
    req.body.sintoma || "",

  temperatura:
    temperatura || 0,

  alergia:
    req.body.alergia || "",

  observacao:
    req.body.observacao || "",

  risco,

  status:
    "aguardando_medico",

  createdAt:
    new Date().toISOString()

};

if (!Array.isArray(db.triagens)) {
  db.triagens = [];
}

db.triagens.push(triagem);

writeDB(db);

res.json(triagem);


} catch (erro) {

console.error(
  "Erro na triagem:",
  erro
);

res.status(500).json({
  erro: "Erro ao registrar triagem."
});


}

});

// ===============================
// LISTAR TRIAGENS
// ===============================

app.get("/triagens", (req, res) => {

const db = readDB();

res.json(
Array.isArray(db.triagens)
? db.triagens
: []
);

});

// ===============================
// LISTA DE MEDICAÇÕES
// ===============================

app.get("/lista-medicacoes", (req, res) => {

res.json([

"Dipirona",
"Paracetamol",
"Ibuprofeno",
"Amoxicilina",
"Azitromicina",
"Loratadina",
"Omeprazol",
"Buscopan",
"Dramin",
"Soro fisiológico"


]);

});

// ===============================
// CONSULTA MÉDICA
// ===============================

app.post("/consulta", (req, res) => {

try {

const db = readDB();

const consulta = {

  id: Date.now(),

  paciente:
    req.body.paciente || "",

  diagnostico:
    req.body.diagnostico || "",

  medicacao:
    req.body.medicacao || "",

  obs:
    req.body.obs || "",

  createdAt:
    new Date().toISOString()

};

if (!Array.isArray(db.consultas)) {
  db.consultas = [];
}

db.consultas.push(consulta);

writeDB(db);

res.json(consulta);


} catch (erro) {

console.error(
  "Erro na consulta:",
  erro
);

res.status(500).json({
  erro: "Erro ao registrar consulta."
});


}

});

// ===============================
// LISTAR CONSULTAS
// ===============================

app.get("/medicacoes", (req, res) => {

const db = readDB();

res.json(
Array.isArray(db.consultas)
? db.consultas
: []
);

});

// ===============================
// INICIAR SERVIDOR
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(
PORT,
"0.0.0.0",
() => {

console.log(
  `🚀 Hospital Sentinela rodando na porta ${PORT}`
);

console.log(
  `📁 Frontend: ${FRONTEND_DIR}`
);

console.log(
  `📁 Banco: ${DB_FILE}`
);


}
);

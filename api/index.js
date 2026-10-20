
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// CAMINHOS
// ==================================================

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const DB_FILE = path.join(__dirname, "../backend/db.json");

console.log("Frontend:", FRONTEND_DIR);
console.log("Banco de dados:", DB_FILE);

// Disponibiliza os arquivos do frontend
app.use(express.static(FRONTEND_DIR));

// ==================================================
// BANCO DE DADOS
// ==================================================

function bancoInicial() {
  return {
    usuarios: [
      { usuario: "triagem", senha: "123", tipo: "triagem" },
      { usuario: "medico", senha: "123", tipo: "medico" },
      { usuario: "atendimento", senha: "123", tipo: "atendimento" }
    ],
    pacientes: [],
    triagens: [],
    consultas: [],
    internacoes: [],
    altas: []
  };
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

    const inicial = bancoInicial();
    writeDB(inicial);
    return inicial;
  }

  const conteudo = fs.readFileSync(DB_FILE, "utf8");
  const db = JSON.parse(conteudo);

  // Garante que as listas necessárias existam.
  const listas = [
    "usuarios",
    "pacientes",
    "triagens",
    "consultas",
    "internacoes",
    "altas"
  ];

  for (const lista of listas) {
    if (!Array.isArray(db[lista])) {
      db[lista] = [];
    }
  }

  // Cria os usuários padrão somente se não houver usuários.
  if (db.usuarios.length === 0) {
    db.usuarios = bancoInicial().usuarios;
    writeDB(db);
  }

  return db;
}

function writeDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(db, null, 2),
    "utf8"
  );
}

function erroServidor(res, mensagem, error) {
  console.error(mensagem, error);

  return res.status(500).json({
    erro: mensagem
  });
}

// ==================================================
// TESTE DO SERVIDOR
// ==================================================

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==================================================
// LOGIN
// ==================================================

app.post("/login", (req, res) => {
  try {
    const db = readDB();

    const usuario = String(req.body?.usuario || "").trim();
    const senha = String(req.body?.senha || "").trim();

    if (!usuario || !senha) {
      return res.status(400).json({
        erro: "Preencha o usuário e a senha."
      });
    }

    const user = db.usuarios.find((u) =>
      String(u.usuario || "").trim() === usuario &&
      String(u.senha || "").trim() === senha
    );

    if (!user) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos."
      });
    }

    // Retorna somente os dados necessários ao frontend.
    return res.json({
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (error) {
    return erroServidor(
      res,
      "Erro ao realizar login. Confira o banco de dados.",
      error
    );
  }
});

// ==================================================
// ATENDIMENTO
// ==================================================

app.post("/atendimento", (req, res) => {
  try {
    const db = readDB();

    const paciente = {
      id: Date.now(),
      nome: String(req.body?.nome || "").trim(),
      cpf: String(req.body?.cpf || "").trim(),
      tipo: req.body?.tipo || "Particular",
      status: "triagem",
      createdAt: new Date().toISOString()
    };

    if (!paciente.nome) {
      return res.status(400).json({
        erro: "Informe o nome do paciente."
      });
    }

    db.pacientes.push(paciente);
    writeDB(db);

    return res.status(201).json(paciente);

  } catch (error) {
    return erroServidor(res, "Erro ao cadastrar paciente.", error);
  }
});

// ==================================================
// TRIAGEM
// ==================================================

app.post("/triagem", (req, res) => {
  try {
    const db = readDB();

    const nome = String(req.body?.nome || "").trim();
    const temperaturaTexto = req.body?.temperatura;

    const temperatura =
      temperaturaTexto === "" ||
      temperaturaTexto === null ||
      temperaturaTexto === undefined
        ? null
        : Number(temperaturaTexto);

    if (!nome) {
      return res.status(400).json({
        erro: "Informe o nome do paciente."
      });
    }

    if (
      temperatura !== null &&
      (!Number.isFinite(temperatura) ||
       temperatura < 25 ||
       temperatura > 45)
    ) {
      return res.status(400).json({
        erro: "Temperatura inválida."
      });
    }

    let risco = req.body?.risco || "verde";

    // Regras preliminares do sistema; a avaliação clínica
    // deve ser feita por profissional de saúde.
    if (temperatura !== null && temperatura >= 39) {
      risco = "vermelho";
    } else if (temperatura !== null && temperatura >= 38) {
      risco = "amarelo";
    }

    const triagem = {
      id: Date.now(),
      nome,
      sintoma: req.body?.sintoma || req.body?.sintomas || "",
      temperatura,
      alergia: req.body?.alergia || "",
      observacao: req.body?.observacao || "",
      risco,
      status: "aguardando_medico",
      createdAt: new Date().toISOString()
    };

    db.triagens.push(triagem);
    writeDB(db);

    return res.status(201).json(triagem);

  } catch (error) {
    return erroServidor(res, "Erro ao salvar triagem.", error);
  }
});

// ==================================================
// LISTAR TRIAGENS
// ==================================================

app.get("/triagens", (req, res) => {
  try {
    const db = readDB();
    return res.json(db.triagens);

  } catch (error) {
    return erroServidor(res, "Erro ao buscar triagens.", error);
  }
});

// ==================================================
// LISTA DE MEDICAÇÕES
// ==================================================

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

// ==================================================
// CONSULTA
// ==================================================

app.post("/consulta", (req, res) => {
  try {
    const db = readDB();

    const paciente = String(req.body?.paciente || "").trim();

    if (!paciente) {
      return res.status(400).json({
        erro: "Selecione um paciente."
      });
    }

    const consulta = {
      id: Date.now(),
      paciente,
      diagnostico: req.body?.diagnostico || "",
      medicacao: req.body?.medicacao || "",
      obs: req.body?.obs || "",
      createdAt: new Date().toISOString()
    };

    db.consultas.push(consulta);
    writeDB(db);

    return res.status(201).json(consulta);

  } catch (error) {
    return erroServidor(res, "Erro ao salvar consulta.", error);
  }
});

// ==================================================
// LISTAR CONSULTAS
// ==================================================

app.get("/medicacoes", (req, res) => {
  try {
    const db = readDB();
    return res.json(db.consultas);

  } catch (error) {
    return erroServidor(res, "Erro ao buscar consultas.", error);
  }
});

// ==================================================
// INTERNAÇÃO
// ==================================================

app.post("/internacao", (req, res) => {
  try {
    const db = readDB();

    const paciente = String(req.body?.paciente || "").trim();
    const setor = String(req.body?.setor || "").trim();
    const quarto = String(req.body?.quarto || "").trim();
    const motivo = String(req.body?.motivo || "").trim();

    if (!paciente || !setor || !quarto || !motivo) {
      return res.status(400).json({
        erro: "Preencha o paciente, setor, quarto/leito e motivo."
      });
    }

    const internacao = {
      id: Date.now(),
      paciente,
      setor,
      quarto,
      motivo,
      observacoes: req.body?.observacoes || "",
      createdAt: new Date().toISOString()
    };

    db.internacoes.push(internacao);
    writeDB(db);

    return res.status(201).json(internacao);

  } catch (error) {
    return erroServidor(res, "Erro ao registrar internação.", error);
  }
});

// ==================================================
// ALTA
// ==================================================

app.post("/alta", (req, res) => {
  try {
    const db = readDB();

    const paciente = String(req.body?.paciente || "").trim();
    const condicao = String(req.body?.condicao || "").trim();
    const orientacoes = String(req.body?.orientacoes || "").trim();

    if (!paciente || !condicao || !orientacoes) {
      return res.status(400).json({
        erro: "Preencha o paciente, a condição e as orientações."
      });
    }

    const alta = {
      id: Date.now(),
      paciente,
      condicao,
      orientacoes,
      retorno: req.body?.retorno || "",
      observacoes: req.body?.observacoes || "",
      createdAt: new Date().toISOString()
    };

    db.altas.push(alta);
    writeDB(db);

    return res.status(201).json(alta);

  } catch (error) {
    return erroServidor(res, "Erro ao registrar alta.", error);
  }
});

// ==================================================
// PÁGINA INICIAL
// ==================================================

app.get("/", (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, "index.html");

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send(
      "index.html não encontrado na pasta frontend."
    );
  }

  return res.sendFile(indexPath);
});

// ==================================================
// ROTA NÃO ENCONTRADA
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada."
  });
});

// Exporta o Express para ambientes que usam api/index.js.
module.exports = app;

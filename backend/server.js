const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================================
CAMINHOS
====================================================
*/

// Pasta backend
const BACKEND_DIR = __dirname;

// Pasta principal do projeto
const ROOT_DIR = path.join(__dirname, "..");

// Frontend
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");

// Banco de dados
const DB_FILE = path.join(BACKEND_DIR, "db.json");

console.log("📁 Backend:", BACKEND_DIR);
console.log("📁 Frontend:", FRONTEND_DIR);
console.log("📁 Banco:", DB_FILE);

/*
====================================================
 FRONTEND
====================================================
*/

app.use(express.static(FRONTEND_DIR));

/*
====================================================
 BANCO DE DADOS
====================================================
*/

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

    const arquivo = fs.readFileSync(
      DB_FILE,
      "utf8"
    );

    return JSON.parse(arquivo);

  } catch (error) {

    console.error(
      "❌ Erro ao ler db.json:",
      error
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

  } catch (error) {

    console.error(
      "❌ Erro ao salvar banco:",
      error
    );

    throw error;
  }
}

/*
====================================================
 LOGIN
====================================================
*/

app.post("/login", (req, res) => {

  try {

    const db = readDB();

    const usuario = String(
      req.body.usuario || ""
    ).trim();

    const senha = String(
      req.body.senha || ""
    ).trim();

    console.log(
      `🔐 Tentativa de login: ${usuario}`
    );

    if (!usuario || !senha) {

      return res.status(400).json({
        erro: "Usuário e senha são obrigatórios."
      });
    }

    const user = db.usuarios.find(
      u =>
        String(u.usuario).trim() === usuario &&
        String(u.senha).trim() === senha
    );

    if (!user) {

      console.log(
        `❌ Login inválido: ${usuario}`
      );

      return res.status(401).json({
        erro: "Usuário ou senha inválidos."
      });
    }

    console.log(
      `✅ Login realizado: ${usuario} (${user.tipo})`
    );

    return res.json({
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (error) {

    console.error(
      "❌ Erro no login:",
      error
    );

    return res.status(500).json({
      erro: "Erro interno no servidor."
    });
  }
});

/*
====================================================
 ATENDIMENTO
====================================================
*/

app.post("/atendimento", (req, res) => {

  try {

    const db = readDB();

    const paciente = {
      id: Date.now(),
      nome: req.body.nome || "",
      cpf: req.body.cpf || "",
      tipo: req.body.tipo || "Particular",
      status: "triagem",
      createdAt: new Date().toISOString()
    };

    db.pacientes.push(paciente);

    writeDB(db);

    res.json(paciente);

  } catch (error) {

    console.error(
      "❌ Erro no atendimento:",
      error
    );

    res.status(500).json({
      erro: "Erro ao cadastrar paciente."
    });
  }
});

/*
====================================================
 TRIAGEM
====================================================
*/

app.post("/triagem", (req, res) => {

  try {

    const db = readDB();

    let risco = req.body.risco;

    const temperatura = Number(
      req.body.temperatura
    );

    if (temperatura >= 39) {

      risco = "vermelho";

    } else if (temperatura >= 38) {

      risco = "amarelo";

    } else if (!risco) {

      risco = "verde";
    }

    const triagem = {

      id: Date.now(),

      nome: req.body.nome || "",

      sintoma:
        req.body.sintoma ||
        req.body.sintomas ||
        "",

      temperatura:
        req.body.temperatura || "",

      alergia:
        req.body.alergia || "",

      observacao:
        req.body.observacao || "",

      risco: risco,

      status: "aguardando_medico",

      createdAt: new Date().toISOString()
    };

    db.triagens.push(triagem);

    writeDB(db);

    res.json(triagem);

  } catch (error) {

    console.error(
      "❌ Erro na triagem:",
      error
    );

    res.status(500).json({
      erro: "Erro ao salvar triagem."
    });
  }
});

/*
====================================================
 LISTAR TRIAGENS
====================================================
*/

app.get("/triagens", (req, res) => {

  try {

    const db = readDB();

    res.json(db.triagens);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar triagens."
    });
  }
});

/*
====================================================
 LISTA DE MEDICAÇÕES
====================================================
*/

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

/*
====================================================
 CONSULTA
====================================================
*/

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

    db.consultas.push(consulta);

    writeDB(db);

    res.json(consulta);

  } catch (error) {

    console.error(
      "❌ Erro na consulta:",
      error
    );

    res.status(500).json({
      erro: "Erro ao salvar consulta."
    });
  }
});

/*
====================================================
 MEDICAÇÕES / CONSULTAS
====================================================
*/

app.get("/medicacoes", (req, res) => {

  try {

    const db = readDB();

    res.json(db.consultas);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar consultas."
    });
  }
});

/*
====================================================
 ROTA PRINCIPAL
====================================================
*/

app.get("/", (req, res) => {

  const indexPath = path.join(
    FRONTEND_DIR,
    "index.html"
  );

  if (!fs.existsSync(indexPath)) {

    console.error(
      "❌ index.html não encontrado:",
      indexPath
    );

    return res.status(404).send(
      "index.html não encontrado. Verifique a pasta frontend."
    );
  }

  res.sendFile(indexPath);
});

/*
====================================================
 404
====================================================
*/

app.use((req, res) => {

  res.status(404).json({
    erro: "Rota não encontrada."
  });
});

/*
====================================================
 SERVIDOR
====================================================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

  console.log("");
  console.log("======================================");
  console.log("🚀 HOSPITAL SENTINELA");
  console.log("======================================");
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`📁 Frontend: ${FRONTEND_DIR}`);
  console.log(`📁 Banco: ${DB_FILE}`);
  console.log("======================================");
});

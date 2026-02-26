import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("flame_me.db");

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo TEXT CHECK(sexo IN ('M', 'F')),
    gravida BOOLEAN DEFAULT 0,
    mulher_idade_fertil BOOLEAN DEFAULT 0,
    puerpera BOOLEAN DEFAULT 0,
    data_parto DATE,
    localidade TEXT,
    contacto_responsavel TEXT,
    numero_identificacao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vacinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    doses_por_frasco INTEGER NOT NULL,
    prazo_uso_horas INTEGER NOT NULL,
    grupo_alvo TEXT, -- crianca | mif | gravida | puerpera | adulto | hpv
    total_doses_esquema INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS frascos_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vacina_id INTEGER,
    lote TEXT NOT NULL,
    validade DATE NOT NULL,
    doses_restantes INTEGER NOT NULL,
    estado TEXT CHECK(estado IN ('disponivel', 'aberto', 'consumido', 'expirado')) DEFAULT 'disponivel',
    data_abertura DATETIME,
    data_expiracao_uso DATETIME,
    data_entrada DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (vacina_id) REFERENCES vacinas(id)
  );

  CREATE TABLE IF NOT EXISTS administracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER,
    vacina_id INTEGER,
    frasco_id INTEGER,
    numero_dose INTEGER NOT NULL,
    data_administracao DATE DEFAULT CURRENT_DATE,
    responsavel TEXT,
    observacoes TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (vacina_id) REFERENCES vacinas(id),
    FOREIGN KEY (frasco_id) REFERENCES frascos_stock(id)
  );

  CREATE TABLE IF NOT EXISTS desperdicio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    frasco_id INTEGER,
    doses_desperdicadas INTEGER NOT NULL,
    motivo TEXT CHECK(motivo IN ('prazo_expirado', 'validade_vencida', 'outro')),
    data_registo DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (frasco_id) REFERENCES frascos_stock(id)
  );
`);

// Populate initial vaccines if empty
const vaccineCount = db.prepare("SELECT COUNT(*) as count FROM vacinas").get() as { count: number };
if (vaccineCount.count === 0) {
  const insertVaccine = db.prepare(`
    INSERT INTO vacinas (nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialVaccines = [
    ["BCG", 20, 6, "crianca", 1],
    ["HepB0", 1, 24, "crianca", 1],
    ["Polio 0", 20, 72, "crianca", 1],
    ["Polio 1", 20, 72, "crianca", 1],
    ["Polio 2", 20, 72, "crianca", 1],
    ["Polio 3", 20, 72, "crianca", 1],
    ["Penta 1", 10, 168, "crianca", 1],
    ["Penta 2", 10, 168, "crianca", 1],
    ["Penta 3", 10, 168, "crianca", 1],
    ["Pneumo 1", 1, 168, "crianca", 1],
    ["Pneumo 2", 1, 168, "crianca", 1],
    ["Pneumo 3", 1, 168, "crianca", 1],
    ["Rotavirus 1", 1, 24, "crianca", 1],
    ["Rotavirus 2", 1, 24, "crianca", 1],
    ["Sarampo-Rubeola 1", 10, 6, "crianca", 1],
    ["Sarampo-Rubeola 2", 10, 6, "crianca", 1],
    ["HPV", 1, 168, "hpv", 2],
    ["Toxoide Td", 10, 168, "mif", 5],
    ["Vitamina A", 1, 24, "puerpera", 1]
  ];

  for (const v of initialVaccines) {
    insertVaccine.run(...v);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Patients
  app.get("/api/pacientes", (req, res) => {
    const q = req.query.q as string;
    let patients;
    if (q) {
      patients = db.prepare("SELECT * FROM pacientes WHERE nome LIKE ? OR numero_identificacao LIKE ?").all(`%${q}%`, `%${q}%`);
    } else {
      patients = db.prepare("SELECT * FROM pacientes ORDER BY criado_em DESC LIMIT 50").all();
    }
    res.json(patients);
  });

  app.post("/api/pacientes", (req, res) => {
    const { nome, data_nascimento, sexo, gravida, mulher_idade_fertil, puerpera, data_parto, localidade, contacto_responsavel, numero_identificacao } = req.body;
    const info = db.prepare(`
      INSERT INTO pacientes (nome, data_nascimento, sexo, gravida, mulher_idade_fertil, puerpera, data_parto, localidade, contacto_responsavel, numero_identificacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nome, data_nascimento, sexo, gravida ? 1 : 0, mulher_idade_fertil ? 1 : 0, puerpera ? 1 : 0, data_parto, localidade, contacto_responsavel, numero_identificacao);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/pacientes/:id", (req, res) => {
    const patient = db.prepare("SELECT * FROM pacientes WHERE id = ?").get(req.params.id);
    const history = db.prepare(`
      SELECT a.*, v.nome as vacina_nome 
      FROM administracoes a 
      JOIN vacinas v ON a.vacina_id = v.id 
      WHERE a.paciente_id = ?
      ORDER BY a.data_administracao DESC
    `).all(req.params.id);
    res.json({ ...patient, history });
  });

  // Vaccines
  app.get("/api/vacinas", (req, res) => {
    const vaccines = db.prepare("SELECT * FROM vacinas").all();
    res.json(vaccines);
  });

  // Stock
  app.get("/api/stock", (req, res) => {
    const stock = db.prepare(`
      SELECT v.nome as vacina_nome, v.id as vacina_id, 
             SUM(CASE WHEN f.estado = 'disponivel' THEN 1 ELSE 0 END) as frascos_disponiveis,
             SUM(CASE WHEN f.estado = 'aberto' THEN 1 ELSE 0 END) as frascos_abertos,
             MIN(CASE WHEN f.estado = 'disponivel' THEN f.validade ELSE NULL END) as validade_proxima
      FROM vacinas v
      LEFT JOIN frascos_stock f ON v.id = f.vacina_id
      GROUP BY v.id
    `).all();
    res.json(stock);
  });

  app.get("/api/stock/abertos", (req, res) => {
    const openVials = db.prepare(`
      SELECT f.*, v.nome as vacina_nome, v.prazo_uso_horas
      FROM frascos_stock f
      JOIN vacinas v ON f.vacina_id = v.id
      WHERE f.estado = 'aberto'
    `).all();
    res.json(openVials);
  });

  app.post("/api/stock/entrada", (req, res) => {
    const { vacina_id, lote, validade, quantidade } = req.body;
    const vacina = db.prepare("SELECT doses_por_frasco FROM vacinas WHERE id = ?").get(vacina_id) as any;
    
    const insert = db.prepare(`
      INSERT INTO frascos_stock (vacina_id, lote, validade, doses_restantes, estado)
      VALUES (?, ?, ?, ?, 'disponivel')
    `);

    for (let i = 0; i < quantidade; i++) {
      insert.run(vacina_id, lote, validade, vacina.doses_por_frasco);
    }
    res.json({ success: true });
  });

  // Administration
  app.post("/api/administrar", (req, res) => {
    const { paciente_id, vacina_id, responsavel, observacoes } = req.body;
    
    // 1. Find open vial
    let vial = db.prepare(`
      SELECT * FROM frascos_stock 
      WHERE vacina_id = ? AND estado = 'aberto' AND doses_restantes > 0 AND data_expiracao_uso > datetime('now')
    `).get(vacina_id) as any;

    if (!vial) {
      // 2. Open new vial if none open
      vial = db.prepare(`
        SELECT * FROM frascos_stock 
        WHERE vacina_id = ? AND estado = 'disponivel' AND validade > date('now')
        ORDER BY validade ASC LIMIT 1
      `).get(vacina_id) as any;

      if (!vial) {
        return res.status(400).json({ error: "Sem stock disponível para esta vacina." });
      }

      const vacina = db.prepare("SELECT prazo_uso_horas FROM vacinas WHERE id = ?").get(vacina_id) as any;
      const dataAbertura = new Date().toISOString();
      const dataExpiracao = new Date(Date.now() + vacina.prazo_uso_horas * 60 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE frascos_stock 
        SET estado = 'aberto', data_abertura = ?, data_expiracao_uso = ? 
        WHERE id = ?
      `).run(dataAbertura, dataExpiracao, vial.id);
      
      vial.id = vial.id;
      vial.doses_restantes = vial.doses_restantes;
    }

    // 3. Register administration
    const nextDose = (db.prepare("SELECT COUNT(*) as count FROM administracoes WHERE paciente_id = ? AND vacina_id = ?").get(paciente_id, vacina_id) as any).count + 1;
    
    db.prepare(`
      INSERT INTO administracoes (paciente_id, vacina_id, frasco_id, numero_dose, responsavel, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(paciente_id, vacina_id, vial.id, nextDose, responsavel, observacoes);

    // 4. Update vial doses
    const newDoses = vial.doses_restantes - 1;
    db.prepare(`
      UPDATE frascos_stock 
      SET doses_restantes = ?, estado = ? 
      WHERE id = ?
    `).run(newDoses, newDoses === 0 ? 'consumido' : 'aberto', vial.id);

    res.json({ success: true });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", (req, res) => {
    const dosesHoje = db.prepare("SELECT COUNT(*) as count FROM administracoes WHERE data_administracao = date('now')").get() as any;
    const pacientesHoje = db.prepare("SELECT COUNT(DISTINCT paciente_id) as count FROM administracoes WHERE data_administracao = date('now')").get() as any;
    const frascosAbertos = db.prepare("SELECT COUNT(*) as count FROM frascos_stock WHERE estado = 'aberto'").get() as any;
    
    res.json({
      dosesHoje: dosesHoje.count,
      pacientesHoje: pacientesHoje.count,
      frascosAbertos: frascosAbertos.count,
      alertasPendentes: 0 // Placeholder
    });
  });

  // Waste detection (should be called periodically or on dashboard load)
  app.post("/api/cron/check-waste", (req, res) => {
    const expiredVials = db.prepare(`
      SELECT * FROM frascos_stock 
      WHERE (estado = 'aberto' AND data_expiracao_uso < datetime('now'))
         OR (estado = 'disponivel' AND validade < date('now'))
    `).all() as any[];

    for (const vial of expiredVials) {
      db.prepare(`
        INSERT INTO desperdicio (frasco_id, doses_desperdicadas, motivo)
        VALUES (?, ?, ?)
      `).run(vial.id, vial.doses_restantes, vial.estado === 'aberto' ? 'prazo_expirado' : 'validade_vencida');

      db.prepare("UPDATE frascos_stock SET estado = 'expirado', doses_restantes = 0 WHERE id = ?").run(vial.id);
    }
    res.json({ processed: expiredVials.length });
  });

  // Reports
  app.get("/api/relatorios/diario", (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const report = db.prepare(`
      SELECT a.*, p.nome as paciente_nome, p.data_nascimento, v.nome as vacina_nome
      FROM administracoes a
      JOIN pacientes p ON a.paciente_id = p.id
      JOIN vacinas v ON a.vacina_id = v.id
      WHERE a.data_administracao = ?
    `).all(date);
    res.json(report);
  });

  app.get("/api/relatorios/mensal", (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const report = db.prepare(`
      SELECT v.nome as vacina_nome, a.numero_dose, COUNT(*) as total
      FROM administracoes a
      JOIN vacinas v ON a.vacina_id = v.id
      WHERE strftime('%Y-%m', a.data_administracao) = ?
      GROUP BY v.id, a.numero_dose
    `).all(month);
    res.json(report);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

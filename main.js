const { app, BrowserWindow, ipcMain, shell } = require("electron");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(app.getPath("userData"), "database.db");
const database = new sqlite3.Database(databasePath);
app.setName("GerenciaPet");
app.setAppUserModelId("GerenciaPet");

database.serialize(() => {
    database.run(`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(56) NOT NULL,
    especie VARCHAR(56) NOT NULL,
    raca VARCHAR(56) NOT NULL,
    nascimento DATE,
    sexo VARCHAR(56) NOT NULL,
    dono INTEGER NOT NULL,
    FOREIGN KEY (dono) REFERENCES clientes(id)
  );`);

    database.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    nascimento DATE,
    sexo VARCHAR(56) NOT NULL,
    numero VARCHAR(32) NOT NULL,
    numeroalt VARCHAR(32),
    endereco VARCHAR(255),
    cliente_desde DATE NOT NULL
  );`);

    database.run(`CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    administrador INTEGER,
    FOREIGN KEY (administrador) REFERENCES administradores(id)
    );`);

    database.run(
        `
    CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(255) NOT NULL,
        nascimento DATE,
        sexo VARCHAR(56) NOT NULL,
        numero VARCHAR(32) NOT NULL,
        endereco VARCHAR(255),
        email VARCHAR(255) NOT NULL
    );`
    );

    database.all(`SELECT * FROM administradores;`, (err, row) => {
        if (row.length === 0 && row.length < 1) {
            database.run(
                `
                INSERT INTO administradores (nome, nascimento, sexo, numero, endereco, email)
                VALUES ('GerenciaPets', DATE('now'), 'GerenciaPets', '--/--', '--/--','gerenciapets@root');
            `
            );
        }
    });

    database.run(`CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo INTEGER NOT NULL,
    servico VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    pet INTEGER NOT NULL,
    preco DECIMAL(8, 2) NOT NULL,
    criado_em DATE NOT NULL,
    criado_por INTEGER NOT NULL,
    observacoes TEXT,
    FOREIGN KEY (pet) REFERENCES pets(id),
    FOREIGN KEY (criado_por) REFERENCES administradores(id)
  );`);
});

function createWindow() {
    var mainWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        minHeight: 700,
        minWidth: 1200,
        title: "GereciaPet",
        titleBarOverlay: true,
        autoHideMenuBar: true,
        backgroundColor: "#2e2c29",
        icon: path.join(__dirname, "public/favicon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));

    Menu.setApplicationMenu(null);
    return mainWindow;
}

app.whenReady().then(() => {
    let mainWindow = createWindow();
    mainWindow.maximize();
    mainWindow.focus();

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.handle("external-link", (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle("exec-sql", (event, sql) => {
    return new Promise((resolve, reject) => {
        database.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

ipcMain.handle("get-data", () => {
    return new Promise((resolve, reject) => {
        database.all("SELECT * FROM pets ORDER BY id", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle("select-sql", (event, sql) => {
    return new Promise((resolve, reject) => {
        database.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

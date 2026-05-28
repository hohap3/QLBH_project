const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE, // Khớp với file .env đã sửa
  port: parseInt(process.env.DB_PORT) || 1433, // Mặc định 1433 nếu 1500 lỗi
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Đã kết nối thành công tới SQL Server!");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối SQL Server:", err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};

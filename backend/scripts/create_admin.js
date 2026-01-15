// scripts/create_admin.js
require('dotenv').config();
const { pool } = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');

async function createAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';  
    const email = process.env.ADMIN_EMAIL || 'admin@ipetro.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const name = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2',
      [username, email] 
    );

    if (existing.rowCount > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create admin
    const result = await pool.query(
      `INSERT INTO users (username, name, email, password_hash, role, department, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, username, name, email, role`,
      [username, name, email, password_hash, 'admin', 'Administration', true]
    );  

    console.log(' Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Username:', username); 
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', result.rows[0].role);
    console.log('-----------------------------------');
    console.log('  Login with either username or email');
    console.log('  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
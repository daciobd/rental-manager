import { pool } from './db';
import { seedDatabase } from './seed';

async function resetAndSeed() {
  console.log('Limpando banco de dados...');
  
  try {
    // Deletar dados na ordem correta (por causa das foreign keys)
    await pool.query('DELETE FROM payments');
    console.log('Pagamentos deletados');
    
    await pool.query('DELETE FROM contracts');
    console.log('Contratos deletados');
    
    await pool.query('DELETE FROM properties');
    console.log('Imóveis deletados');
    
    await pool.query('DELETE FROM user_sessions');
    console.log('Sessões deletadas');
    
    await pool.query('DELETE FROM users');
    console.log('Usuários deletados');
    
    console.log('');
    console.log('Executando seed...');
    await seedDatabase();
    
    console.log('');
    console.log('Reset e seed concluídos com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

export { resetAndSeed };

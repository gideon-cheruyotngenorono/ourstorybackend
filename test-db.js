const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:nBKYhkxdlyOSS8TA@db.uymvsurudoxmevpjdrhv.supabase.co:5432/postgres'
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message)
  } else {
    console.log('Success:', res.rows[0])
  }
  pool.end()
})

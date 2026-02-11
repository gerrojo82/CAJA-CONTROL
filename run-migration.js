import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🔧 Ejecutando migración: agregar columna notes a closings...\n');

  try {
    // Leer el archivo SQL
    const sql = fs.readFileSync('./add-notes-column.sql', 'utf8');

    console.log('📝 SQL a ejecutar:');
    console.log(sql);
    console.log('');

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si la función exec_sql no existe, informar al usuario
      if (error.code === '42883') {
        console.log('⚠️  La función exec_sql no está disponible con la clave anon.');
        console.log('');
        console.log('👉 Necesitás ejecutar la migración manualmente:');
        console.log('');
        console.log('1. Andá a https://supabase.com/dashboard');
        console.log('2. Seleccioná tu proyecto');
        console.log('3. Andá a SQL Editor');
        console.log('4. Copiá y pegá este SQL:');
        console.log('');
        console.log('   ALTER TABLE public.closings ADD COLUMN IF NOT EXISTS notes text;');
        console.log('');
        console.log('5. Hacé click en Run');
        console.log('');
        return;
      }

      console.error('❌ Error al ejecutar migración:', error);
      return;
    }

    console.log('✅ Migración ejecutada exitosamente!');
    console.log('');
    console.log('La columna "notes" fue agregada a la tabla "closings"');

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

runMigration();

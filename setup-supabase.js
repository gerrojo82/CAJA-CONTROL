import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🔧 Verificando conexión con Supabase...\n');

  // Verificar conexión
  try {
    const { data, error } = await supabase.from('shifts').select('count').limit(1);

    if (error) {
      console.log('⚠️  Las tablas aún no existen. Necesitas ejecutar el SQL en Supabase.\n');
      console.log('📋 Pasos para configurar:');
      console.log('1. Ve a: https://oiujhofygzuvtdofayso.supabase.co');
      console.log('2. En el menú lateral, haz clic en "SQL Editor"');
      console.log('3. Copia el contenido de docs/supabase-schema.sql');
      console.log('4. Pégalo en el editor y haz clic en "Run"\n');
      console.log('Nota: Necesitas permisos de administrador para ejecutar estos comandos.');
      console.log('      La clave "anon" solo permite leer/escribir datos, no crear tablas.\n');
      return;
    }

    console.log('✅ Conexión exitosa con Supabase!');
    console.log('✅ Las tablas están configuradas correctamente\n');

    // Verificar cada tabla
    const tables = ['shifts', 'closings', 'movements', 'transfers', 'audit_log'];

    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Error en tabla ${table}:`, error.message);
      } else {
        console.log(`✅ Tabla "${table}": ${count} registros`);
      }
    }

    console.log('\n🎉 ¡Todo listo! Tu aplicación está conectada a Supabase.');
    console.log('\n💡 Reinicia tu servidor de desarrollo para aplicar los cambios:');
    console.log('   npm run dev\n');

  } catch (err) {
    console.error('❌ Error al conectar:', err.message);
  }
}

setupDatabase();

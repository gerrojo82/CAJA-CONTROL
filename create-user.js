import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
  console.log('👤 Creando usuario en Supabase Auth...\n');

  const email = 'control-cajas@gmail.com';
  const password = 'controlcaja';

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Error al crear usuario:', error.message);

      // Si el usuario ya existe, intentar hacer login para verificar
      if (error.message.includes('already registered')) {
        console.log('\n⚠️  Usuario ya existe. Verificando credenciales...\n');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('❌ Error al verificar:', signInError.message);
          console.log('\n💡 El usuario existe pero la contraseña es diferente.');
          console.log('   Necesitas resetear la contraseña desde Supabase Dashboard.');
        } else {
          console.log('✅ Usuario verificado exitosamente!');
          console.log('\n📧 Email:', signInData.user.email);
          console.log('🆔 User ID:', signInData.user.id);
          console.log('\n✓ Ya podés usar estas credenciales para login.');
        }
      }
      return;
    }

    if (data.user) {
      console.log('✅ Usuario creado exitosamente!\n');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 User ID:', data.user.id);
      console.log('\n' + '═'.repeat(60));
      console.log('📋 CREDENCIALES DE ACCESO:');
      console.log('═'.repeat(60));
      console.log('   Usuario:     control-cajas@gmail.com');
      console.log('   Contraseña:  controlcaja');
      console.log('═'.repeat(60));

      // Verificar si necesita confirmación de email
      if (data.user.confirmed_at) {
        console.log('\n✅ Email confirmado automáticamente');
      } else {
        console.log('\n⚠️  IMPORTANTE: Necesitás confirmar el email');
        console.log('   1. Andá a Supabase Dashboard → Authentication → Users');
        console.log('   2. Buscá el usuario: control-cajas@gmail.com');
        console.log('   3. Click en el menú ... → Send magic link');
        console.log('   O podés desactivar la confirmación en:');
        console.log('   Authentication → Settings → Email Auth → Disable email confirmations');
      }

      console.log('\n🎉 Todo listo para usar el sistema!');
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

createUser();

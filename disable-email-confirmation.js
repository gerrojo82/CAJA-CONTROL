import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function confirmUser() {
  console.log('🔧 Intentando confirmar usuario...\n');

  const email = 'control-cajas@gmail.com';
  const password = 'controlcaja';

  try {
    // Primero intentar hacer login directo (a veces Supabase no requiere confirmación en desarrollo)
    console.log('1. Intentando login sin confirmación...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData.user) {
      console.log('✅ Login exitoso! El usuario ya está activo.\n');
      console.log('📧 Email:', signInData.user.email);
      console.log('🆔 User ID:', signInData.user.id);
      console.log('✓ Email confirmado:', signInData.user.email_confirmed_at ? 'Sí' : 'No');
      console.log('\n🎉 Podés usar la aplicación normalmente!');

      // Cerrar sesión
      await supabase.auth.signOut();
      return;
    }

    // Si el error es por email no confirmado
    if (signInError && signInError.message.includes('Email not confirmed')) {
      console.log('❌ Email no confirmado.\n');
      console.log('👉 Necesitás hacerlo manualmente en Supabase Dashboard:\n');
      console.log('PASOS:');
      console.log('1. Andá a: https://supabase.com/dashboard/project/oiujhofygzuvtdofayso/auth/users');
      console.log('2. Buscá el usuario: control-cajas@gmail.com');
      console.log('3. Hacé click en el email del usuario');
      console.log('4. En el panel lateral que se abre, buscá "Email Confirmed"');
      console.log('5. Si está desmarcado, marcalo y guardá');
      console.log('\nO ALTERNATIVA MÁS FÁCIL:');
      console.log('1. Andá a: https://supabase.com/dashboard/project/oiujhofygzuvtdofayso/settings/auth');
      console.log('2. Buscá la sección "Email Auth"');
      console.log('3. Desactivá "Enable email confirmations"');
      console.log('4. Guardá los cambios');
      console.log('5. Luego creá el usuario de nuevo (borrá el existente primero)');
      return;
    }

    if (signInError) {
      console.error('❌ Error al intentar login:', signInError.message);
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

confirmUser();

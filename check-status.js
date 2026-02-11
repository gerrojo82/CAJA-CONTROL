import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatus() {
  console.log('🔍 Verificando estado de cajas y turnos...\n');

  try {
    // 1. Verificar turnos abiertos
    const { data: openShifts, error: openError } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false });

    if (openError) {
      console.error('Error al verificar turnos:', openError);
      return;
    }

    console.log('═'.repeat(60));
    console.log('📋 TURNOS ABIERTOS:');
    console.log('═'.repeat(60));

    if (openShifts.length === 0) {
      console.log('✅ No hay turnos abiertos\n');
    } else {
      console.log(`⚠️  ${openShifts.length} turno(s) abierto(s):\n`);
      openShifts.forEach(shift => {
        const openedAt = new Date(shift.opened_at);
        console.log(`   🔓 ${shift.store_id}/${shift.register_id}/${shift.shift}`);
        console.log(`      Fecha: ${shift.date}`);
        console.log(`      Abierto por: ${shift.opened_by}`);
        console.log(`      Abierto: ${openedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log(`      Monto inicial: $${shift.opening_amount}`);
        console.log('');
      });
    }

    // 2. Verificar turnos para el 11 de febrero
    const { data: shifts11, error: shifts11Error } = await supabase
      .from('shifts')
      .select('*')
      .eq('date', '2026-02-11')
      .order('opened_at', { ascending: false });

    if (shifts11Error) {
      console.error('Error al verificar turnos del 11:', shifts11Error);
      return;
    }

    console.log('═'.repeat(60));
    console.log('📅 TURNOS PARA EL 11 DE FEBRERO:');
    console.log('═'.repeat(60));

    if (shifts11.length === 0) {
      console.log('✅ No hay turnos para el 11/02\n');
    } else {
      console.log(`⚠️  ${shifts11.length} turno(s) para el 11/02:\n`);
      shifts11.forEach(shift => {
        const openedAt = new Date(shift.opened_at);
        console.log(`   ${shift.status === 'open' ? '🔓' : '🔒'} ${shift.store_id}/${shift.register_id}/${shift.shift}`);
        console.log(`      Estado: ${shift.status}`);
        console.log(`      Abierto: ${openedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log(`      ID: ${shift.id}`);
        console.log('');
      });
    }

    // 3. Verificar todos los turnos por fecha
    const { data: allShifts, error: allError } = await supabase
      .from('shifts')
      .select('date, status, store_id, register_id, shift')
      .order('date', { ascending: false });

    if (allError) {
      console.error('Error al verificar todos los turnos:', allError);
      return;
    }

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN POR FECHA:');
    console.log('═'.repeat(60));

    const byDate = {};
    allShifts.forEach(shift => {
      if (!byDate[shift.date]) {
        byDate[shift.date] = { open: 0, closed: 0, total: 0 };
      }
      byDate[shift.date][shift.status]++;
      byDate[shift.date].total++;
    });

    Object.entries(byDate).forEach(([date, counts]) => {
      console.log(`\n📅 ${date}:`);
      console.log(`   Total: ${counts.total} turnos`);
      console.log(`   Abiertos: ${counts.open || 0}`);
      console.log(`   Cerrados: ${counts.closed || 0}`);
    });

    // 4. Decisión de limpieza
    console.log('\n' + '═'.repeat(60));
    console.log('💡 RECOMENDACIÓN:');
    console.log('═'.repeat(60));

    const needsCleanup = openShifts.length > 0 || shifts11.length > 0;

    if (needsCleanup) {
      console.log('\n⚠️  Se requiere limpieza:');

      if (openShifts.length > 0) {
        console.log(`\n   ${openShifts.length} turno(s) abierto(s) debe(n) cerrarse:`);
        openShifts.forEach(s => {
          console.log(`   - ${s.store_id}/${s.register_id}/${s.shift} (${s.date})`);
        });
      }

      if (shifts11.length > 0) {
        console.log(`\n   ${shifts11.length} turno(s) del 11/02 debe(n) eliminarse:`);
        shifts11.forEach(s => {
          console.log(`   - ${s.store_id}/${s.register_id}/${s.shift} (${s.status})`);
        });
      }

      console.log('\n   Ejecuta: node cleanup.js');
    } else {
      console.log('\n✅ Todo está limpio y listo para usar');
      console.log('   No hay turnos abiertos');
      console.log('   No hay turnos para el 11/02');
      console.log('   Listo para empezar el nuevo día');
    }

    console.log('\n' + '═'.repeat(60));

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

checkStatus();

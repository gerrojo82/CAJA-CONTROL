import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('🧹 Limpiando turnos abiertos...\n');

  try {
    // 1. Obtener todos los turnos abiertos
    const { data: openShifts, error: openError } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'open');

    if (openError) {
      console.error('Error al obtener turnos:', openError);
      return;
    }

    if (openShifts.length === 0) {
      console.log('✅ No hay turnos abiertos para cerrar\n');
      return;
    }

    console.log(`📋 Encontrados ${openShifts.length} turnos abiertos\n`);

    let closed = 0;
    let failed = 0;

    for (const shift of openShifts) {
      const openedAt = new Date(shift.opened_at);
      console.log(`\n🔓 Cerrando: ${shift.store_id}/${shift.register_id}/${shift.shift} (${shift.date})`);
      console.log(`   Abierto por: ${shift.opened_by}`);
      console.log(`   Fecha apertura: ${openedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
      console.log(`   Monto inicial: $${shift.opening_amount}`);

      // Obtener movimientos del turno
      const { data: movements, error: movError } = await supabase
        .from('movements')
        .select('*')
        .eq('store_id', shift.store_id)
        .eq('register_id', shift.register_id)
        .eq('date', shift.date)
        .eq('shift', shift.shift);

      if (movError) {
        console.error(`   ❌ Error al obtener movimientos: ${movError.message}`);
        failed++;
        continue;
      }

      // Calcular flujos de efectivo
      const ingEfvo = movements?.filter(m => m.type === 'ingreso' && m.method === 'efectivo').reduce((s, m) => s + m.amount, 0) || 0;
      const egrEfvo = movements?.filter(m => m.type === 'egreso' && m.method === 'efectivo').reduce((s, m) => s + m.amount, 0) || 0;
      const ingTotal = movements?.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0) || 0;
      const egrTotal = movements?.filter(m => m.type === 'egreso').reduce((s, m) => s + m.amount, 0) || 0;

      const expectedCash = shift.opening_amount + ingEfvo - egrEfvo;
      const countedCash = expectedCash; // Asumimos que el conteo coincide
      const diff = 0; // Diferencia = 0 (cierre perfecto)
      const montoRetirado = Math.max(0, countedCash - shift.opening_amount);

      console.log(`   Movimientos: ${movements?.length || 0}`);
      console.log(`   Efectivo esperado: $${expectedCash}`);
      console.log(`   Monto a retirar: $${montoRetirado}`);

      // Actualizar el turno a cerrado
      const now = new Date();
      const argDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      const closedAt = argDate.toISOString();

      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          status: 'closed',
          closed_at: closedAt,
          closed_by: 'Sistema (auto-cierre)',
          closing_amount: countedCash,
          difference: diff,
          monto_retirado: montoRetirado
        })
        .eq('id', shift.id);

      if (updateError) {
        console.error(`   ❌ Error al cerrar: ${updateError.message}`);
        failed++;
        continue;
      }

      // Crear registro de cierre
      const closing = {
        id: crypto.randomUUID(),
        store_id: shift.store_id,
        register_id: shift.register_id,
        shift: shift.shift,
        date: shift.date,
        closed_by: 'Sistema (auto-cierre)',
        closed_at: closedAt,
        opening_amount: shift.opening_amount,
        ingresos_efectivo: ingEfvo,
        egresos_efectivo: egrEfvo,
        ingresos_total: ingTotal,
        egresos_total: egrTotal,
        expected_cash: expectedCash,
        counted_cash: countedCash,
        difference: diff,
        monto_retirado: montoRetirado,
        transferred_out: 0,
        admin_withdrawn: 0,
        admin_withdrawals: [],
        closing_bills: {},
        closing_coins: {}
      };

      const { error: closingError } = await supabase
        .from('closings')
        .insert(closing);

      if (closingError && closingError.code !== '23505') {
        console.error(`   ⚠️  Error al crear cierre: ${closingError.message}`);
        console.log(`   ✅ Turno cerrado (sin registro de cierre)`);
      } else {
        console.log(`   ✅ Turno cerrado con éxito`);
      }

      closed++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN:');
    console.log('═'.repeat(60));
    console.log(`   ✅ Turnos cerrados: ${closed}`);
    console.log(`   ❌ Errores: ${failed}`);
    console.log('═'.repeat(60));

    if (closed > 0) {
      console.log('\n✅ Limpieza completada');
      console.log('   Todos los turnos abiertos han sido cerrados');
      console.log('   El sistema está listo para empezar de cero\n');
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

cleanup();

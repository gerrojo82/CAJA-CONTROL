import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para ajustar timestamp de UTC a Argentina
const fixTimestamp = (utcTimestamp) => {
  const date = new Date(utcTimestamp);
  // Restar 3 horas para convertir de UTC a Argentina
  date.setHours(date.getHours() - 3);
  return date.toISOString();
};

async function fixAllTimestamps() {
  console.log('🔧 Corrigiendo timestamps en Supabase...\n');

  try {
    // 1. Corregir CIERRES (tabla closings)
    console.log('📋 Corrigiendo cierres...');
    const { data: closings, error: closingsError } = await supabase
      .from('closings')
      .select('*');

    if (closingsError) {
      console.error('Error al leer cierres:', closingsError);
      return;
    }

    console.log(`   Encontrados ${closings.length} cierres`);

    for (const closing of closings) {
      const newClosedAt = fixTimestamp(closing.closed_at);

      const { error: updateError } = await supabase
        .from('closings')
        .update({ closed_at: newClosedAt })
        .eq('id', closing.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar cierre ${closing.id}:`, updateError);
      } else {
        console.log(`   ✅ Cierre ${closing.id}: ${closing.closed_at} → ${newClosedAt}`);
      }
    }

    // 2. Corregir TURNOS (tabla shifts)
    console.log('\n📋 Corrigiendo turnos...');
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*');

    if (shiftsError) {
      console.error('Error al leer turnos:', shiftsError);
      return;
    }

    console.log(`   Encontrados ${shifts.length} turnos`);

    for (const shift of shifts) {
      const updates = {
        opened_at: fixTimestamp(shift.opened_at)
      };

      if (shift.closed_at) {
        updates.closed_at = fixTimestamp(shift.closed_at);
      }

      const { error: updateError } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', shift.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar turno ${shift.id}:`, updateError);
      } else {
        console.log(`   ✅ Turno ${shift.id}: apertura corregida`);
      }
    }

    // 3. Corregir MOVIMIENTOS (tabla movements)
    console.log('\n📋 Corrigiendo movimientos...');
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('*');

    if (movementsError) {
      console.error('Error al leer movimientos:', movementsError);
      return;
    }

    console.log(`   Encontrados ${movements.length} movimientos`);

    for (const movement of movements) {
      const newTs = fixTimestamp(movement.ts);

      const { error: updateError } = await supabase
        .from('movements')
        .update({ ts: newTs })
        .eq('id', movement.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar movimiento ${movement.id}:`, updateError);
      } else {
        console.log(`   ✅ Movimiento ${movement.id}: ${movement.ts} → ${newTs}`);
      }
    }

    // 4. Corregir AUDITORÍA (tabla audit_log)
    console.log('\n📋 Corrigiendo auditoría...');
    const { data: audits, error: auditsError } = await supabase
      .from('audit_log')
      .select('*');

    if (auditsError) {
      console.error('Error al leer auditoría:', auditsError);
      return;
    }

    console.log(`   Encontrados ${audits.length} registros de auditoría`);

    for (const audit of audits) {
      const newTs = fixTimestamp(audit.ts);

      const { error: updateError } = await supabase
        .from('audit_log')
        .update({ ts: newTs })
        .eq('id', audit.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar auditoría ${audit.id}:`, updateError);
      } else {
        console.log(`   ✅ Auditoría ${audit.id}: timestamp corregido`);
      }
    }

    // 5. Corregir TRANSFERENCIAS (tabla transfers)
    console.log('\n📋 Corrigiendo transferencias...');
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('*');

    if (transfersError) {
      console.error('Error al leer transferencias:', transfersError);
      return;
    }

    console.log(`   Encontrados ${transfers.length} transferencias`);

    for (const transfer of transfers) {
      const newTs = fixTimestamp(transfer.ts);

      const { error: updateError } = await supabase
        .from('transfers')
        .update({ ts: newTs })
        .eq('id', transfer.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar transferencia ${transfer.id}:`, updateError);
      } else {
        console.log(`   ✅ Transferencia ${transfer.id}: timestamp corregido`);
      }
    }

    console.log('\n🎉 ¡Todos los timestamps han sido corregidos!');
    console.log('   Los datos ahora muestran la hora correcta de Argentina (GMT-3)');

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

fixAllTimestamps();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiujhofygzuvtdofayso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWpob2Z5Z3p1dnRkb2ZheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzgwNzMsImV4cCI6MjA4NjE1NDA3M30.kmkMr06EZhabZfEzeN0ggjXQ8TrXuVQjnOd4ek7Lg7o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para corregir fecha de timestamp
const fixDate = (timestamp) => {
  const date = new Date(timestamp);
  // Si la hora es menor a 3 (00:00 a 02:59 UTC), es del día anterior
  if (date.getUTCHours() < 3) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  // Extraer solo la fecha YYYY-MM-DD
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

async function fixAllDates() {
  console.log('🔧 Corrigiendo FECHAS en columnas date...\n');

  try {
    // 1. Corregir CIERRES
    console.log('📋 Corrigiendo fechas de cierres...');
    const { data: closings, error: closingsError } = await supabase
      .from('closings')
      .select('*');

    if (closingsError) {
      console.error('Error al leer cierres:', closingsError);
      return;
    }

    console.log(`   Encontrados ${closings.length} cierres`);

    for (const closing of closings) {
      // Corregir la fecha basándose en closed_at
      const correctDate = fixDate(closing.closed_at);

      if (correctDate !== closing.date) {
        const { error: updateError } = await supabase
          .from('closings')
          .update({ date: correctDate })
          .eq('id', closing.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar cierre ${closing.id}:`, updateError);
        } else {
          console.log(`   ✅ Cierre ${closing.id}: ${closing.date} → ${correctDate}`);
        }
      } else {
        console.log(`   ⏭️  Cierre ${closing.id}: ${closing.date} (ya correcta)`);
      }
    }

    // 2. Corregir TURNOS
    console.log('\n📋 Corrigiendo fechas de turnos...');
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*');

    if (shiftsError) {
      console.error('Error al leer turnos:', shiftsError);
      return;
    }

    console.log(`   Encontrados ${shifts.length} turnos`);

    for (const shift of shifts) {
      // Corregir la fecha basándose en opened_at
      const correctDate = fixDate(shift.opened_at);

      if (correctDate !== shift.date) {
        const { error: updateError } = await supabase
          .from('shifts')
          .update({ date: correctDate })
          .eq('id', shift.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar turno ${shift.id}:`, updateError);
        } else {
          console.log(`   ✅ Turno ${shift.id}: ${shift.date} → ${correctDate}`);
        }
      } else {
        console.log(`   ⏭️  Turno ${shift.id}: ${shift.date} (ya correcta)`);
      }
    }

    // 3. Corregir MOVIMIENTOS
    console.log('\n📋 Corrigiendo fechas de movimientos...');
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('*');

    if (movementsError) {
      console.error('Error al leer movimientos:', movementsError);
      return;
    }

    console.log(`   Encontrados ${movements.length} movimientos`);

    for (const movement of movements) {
      // Corregir la fecha basándose en ts
      const correctDate = fixDate(movement.ts);

      if (correctDate !== movement.date) {
        const { error: updateError } = await supabase
          .from('movements')
          .update({ date: correctDate })
          .eq('id', movement.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar movimiento ${movement.id}:`, updateError);
        } else {
          console.log(`   ✅ Movimiento ${movement.id}: ${movement.date} → ${correctDate}`);
        }
      } else {
        console.log(`   ⏭️  Movimiento ${movement.id}: ${movement.date} (ya correcta)`);
      }
    }

    // 4. Corregir TRANSFERENCIAS
    console.log('\n📋 Corrigiendo fechas de transferencias...');
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('*');

    if (transfersError) {
      console.error('Error al leer transferencias:', transfersError);
      return;
    }

    console.log(`   Encontrados ${transfers.length} transferencias`);

    for (const transfer of transfers) {
      const updates = {};

      // Corregir from_date
      const correctFromDate = fixDate(transfer.ts);
      if (correctFromDate !== transfer.from_date) {
        updates.from_date = correctFromDate;
      }

      // Corregir to_date
      if (correctFromDate !== transfer.to_date) {
        updates.to_date = correctFromDate;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('transfers')
          .update(updates)
          .eq('id', transfer.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar transferencia ${transfer.id}:`, updateError);
        } else {
          console.log(`   ✅ Transferencia ${transfer.id}: fechas corregidas`);
        }
      } else {
        console.log(`   ⏭️  Transferencia ${transfer.id}: fechas ya correctas`);
      }
    }

    console.log('\n🎉 ¡Todas las fechas han sido corregidas!');
    console.log('   Las fechas ahora corresponden al día correcto según hora Argentina');

    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    const { data: closingsCheck } = await supabase.from('closings').select('date, closed_at').order('closed_at');
    const { data: shiftsCheck } = await supabase.from('shifts').select('date, opened_at').order('opened_at');

    console.log('\nCierres:');
    closingsCheck?.forEach(c => {
      const closedAt = new Date(c.closed_at);
      console.log(`   Fecha: ${c.date} | Cerrado: ${closedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    });

    console.log('\nTurnos (últimos 5):');
    shiftsCheck?.slice(-5).forEach(s => {
      const openedAt = new Date(s.opened_at);
      console.log(`   Fecha: ${s.date} | Abierto: ${openedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
    });

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

fixAllDates();

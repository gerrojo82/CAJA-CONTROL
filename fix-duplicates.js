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

async function fixDuplicates() {
  console.log('🔧 Eliminando turnos duplicados y corrigiendo fechas...\n');

  try {
    // 1. Obtener todos los turnos
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .order('opened_at', { ascending: true });

    if (shiftsError) {
      console.error('Error al leer turnos:', shiftsError);
      return;
    }

    console.log(`📋 Encontrados ${shifts.length} turnos totales\n`);

    // 2. Agrupar por store_id, register_id, shift y fecha correcta
    const groups = {};

    for (const shift of shifts) {
      const correctDate = fixDate(shift.opened_at);
      const key = `${shift.store_id}_${shift.register_id}_${correctDate}_${shift.shift}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...shift, correctDate });
    }

    // 3. Procesar cada grupo
    let duplicatesFound = 0;
    let duplicatesDeleted = 0;
    let datesFixed = 0;

    for (const [key, turnosInGroup] of Object.entries(groups)) {
      if (turnosInGroup.length > 1) {
        duplicatesFound++;
        console.log(`\n🔍 Duplicado encontrado: ${key}`);
        console.log(`   ${turnosInGroup.length} turnos en este grupo:`);

        // Ordenar por fecha de apertura (el más antiguo primero)
        turnosInGroup.sort((a, b) => new Date(a.opened_at) - new Date(b.opened_at));

        // Mantener el primero (más antiguo), eliminar el resto
        const [keepThis, ...deleteThese] = turnosInGroup;

        console.log(`   ✅ MANTENER: ${keepThis.id} - Abierto: ${new Date(keepThis.opened_at).toLocaleString('es-AR')}`);

        for (const toDelete of deleteThese) {
          console.log(`   ❌ ELIMINAR: ${toDelete.id} - Abierto: ${new Date(toDelete.opened_at).toLocaleString('es-AR')}`);

          const { error: deleteError } = await supabase
            .from('shifts')
            .delete()
            .eq('id', toDelete.id);

          if (deleteError) {
            console.error(`      Error al eliminar: ${deleteError.message}`);
          } else {
            duplicatesDeleted++;
            console.log(`      ✓ Eliminado exitosamente`);
          }
        }

        // Corregir la fecha del turno que mantenemos
        if (keepThis.date !== keepThis.correctDate) {
          const { error: updateError } = await supabase
            .from('shifts')
            .update({ date: keepThis.correctDate })
            .eq('id', keepThis.id);

          if (updateError) {
            console.error(`   Error al actualizar fecha: ${updateError.message}`);
          } else {
            datesFixed++;
            console.log(`   ✓ Fecha corregida: ${keepThis.date} → ${keepThis.correctDate}`);
          }
        }
      } else {
        // Solo un turno en este grupo, corregir la fecha si es necesario
        const shift = turnosInGroup[0];
        if (shift.date !== shift.correctDate) {
          const { error: updateError } = await supabase
            .from('shifts')
            .update({ date: shift.correctDate })
            .eq('id', shift.id);

          if (updateError) {
            console.error(`❌ Error al actualizar ${shift.id}: ${updateError.message}`);
          } else {
            datesFixed++;
            console.log(`✅ Turno ${shift.store_id}/${shift.register_id}/${shift.shift}: ${shift.date} → ${shift.correctDate}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   Grupos duplicados encontrados: ${duplicatesFound}`);
    console.log(`   Turnos duplicados eliminados: ${duplicatesDeleted}`);
    console.log(`   Fechas corregidas: ${datesFixed}`);
    console.log('='.repeat(60));

    // Mostrar estado final
    const { data: finalShifts } = await supabase
      .from('shifts')
      .select('store_id, register_id, shift, date, opened_at, status')
      .order('opened_at', { ascending: false })
      .limit(10);

    console.log('\n📋 Últimos 10 turnos (después de corrección):');
    finalShifts?.forEach(s => {
      const opened = new Date(s.opened_at);
      console.log(`   ${s.store_id}/${s.register_id}/${s.shift} - Fecha: ${s.date} - Abierto: ${opened.toLocaleString('es-AR')} - ${s.status}`);
    });

    console.log('\n🎉 ¡Proceso completado!');

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

fixDuplicates();

-- Unicidad por turno
create unique index if not exists uq_shifts_store_reg_date_shift
  on public.shifts (store_id, register_id, date, shift);

-- Un solo cierre por turno
create unique index if not exists uq_closings_store_reg_date_shift
  on public.closings (store_id, register_id, date, shift);

-- Evitar duplicados exactos de movimientos
create unique index if not exists uq_movements_dedupe
  on public.movements (store_id, register_id, date, shift, type, amount, description, method, ts);

-- Evitar duplicados exactos de transferencias
create unique index if not exists uq_transfers_dedupe
  on public.transfers (from_closing_id, to_store, to_register, to_shift, to_date, amount, ts);

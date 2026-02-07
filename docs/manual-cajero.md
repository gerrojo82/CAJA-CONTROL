# Manual Cajero (CajaControl)

Version: 1.0
Idioma: Espanol (rioplatense)

## Objetivo del modulo
El modulo de cajero permite:
- Abrir un turno con conteo inicial de efectivo.
- Registrar pagos/extracciones con categoria y metodo.
- Solicitar fondos disponibles de cierres anteriores de la misma tienda.
- Cerrar turno con arqueo, diferencia y retiro.
- Revisar movimientos del turno en curso.

## Pantalla principal del cajero
**Elementos clave:**
- Encabezado con tienda, caja y turno.
- Estadisticas: Fondo, Ingresos en efectivo, Egresos en efectivo, Esperado en caja.
- Boton **Pago / Extraccion**.
- Boton **Fondos** con disponible (solo de la misma tienda).
- Lista de movimientos del turno.

[CAPTURA: Pantalla principal del cajero]

## 1) Abrir turno
**Cuándo:** al iniciar el turno, antes de operar.

**Pasos:**
1. Presionar **Abrir Turno**.
2. Contar billetes y monedas en el modulo de conteo.
3. Verificar el total y confirmar.

**Resultado:**
- Se guarda el fondo inicial.
- El turno queda abierto.

[CAPTURA: Modal Abrir Turno]

## 2) Registrar pago / extraccion
**Cuándo:** cuando se paga a un proveedor, se registra un ticket, o un egreso con otro motivo.

**Pasos:**
1. Presionar **Pago / Extraccion**.
2. Elegir **Tipo**: Proveedor, Ticket u Otros.
3. Ingresar **Monto**.
4. Escribir **Comentario**.
5. Seleccionar **Metodo** (efectivo, transferencia, tarjeta, cheque, MercadoPago).
6. Presionar **Registrar**.

**Resultado:**
- Se registra el egreso con categoria.
- Impacta en los totales del turno.

[CAPTURA: Modal Extraccion con tipo]

## 3) Solicitar fondos
**Cuándo:** cuando el cajero necesita fondos provenientes de cierres anteriores.

**Reglas:**
- Solo se pueden usar fondos de la misma tienda.
- El disponible se calcula por cierre (retirado - transferido - retiro admin).

**Pasos:**
1. Presionar **Fondos**.
2. Elegir el cierre con disponible.
3. Ingresar monto (o usar **Max**).
4. Agregar motivo (opcional) y confirmar.

**Resultado:**
- Se genera un ingreso por transferencia interna.
- Se descuenta el disponible del cierre origen.

[CAPTURA: Modal Solicitar Fondos]

## 4) Ver movimientos
**Cuándo:** en cualquier momento para revisar operaciones del turno.

**Contenido:**
- Descripcion del movimiento.
- Hora y metodo.
- Etiqueta de categoria (si aplica) y de transferencia.

[CAPTURA: Lista de movimientos]

## 5) Cerrar turno / caja
**Cuándo:** al final del turno.

**Pasos:**
1. Presionar **Cerrar turno/caja**.
2. Contar billetes y monedas en el cierre.
3. Revisar el esperado vs contado y confirmar.

**Resultado:**
- Se registra el cierre.
- Se calcula diferencia (si hay).
- Se guarda el retiro y el disponible del cierre.

[CAPTURA: Modal Cerrar Turno]

## Buenas practicas
- Registrar los pagos en el momento en que ocurren.
- Usar comentarios claros (Proveedor X, Ticket Y).
- Verificar el esperado antes de cerrar.
- No mezclar fondos entre tiendas.

## Mensajes comunes
- "Mayor al disponible": el cierre no tiene fondos suficientes.
- "Monto invalido": revisar el numero ingresado.
- "Descripcion requerida": completar comentario en extraccion.

import { fmt, fmtDate, fmtTime } from "./formatters";
import { regLabel } from "./constants";

export const printClosing = (closing) => {
    const printWindow = window.open('', '_blank');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cierre de Caja - ${regLabel(closing.storeId, closing.registerId)} ${closing.shift}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 12px;
            color: #666;
        }
        .section {
            margin: 15px 0;
            padding: 10px 0;
            border-bottom: 1px dashed #ccc;
        }
        .section:last-child {
            border-bottom: 2px dashed #000;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 13px;
        }
        .row.highlight {
            font-weight: bold;
            font-size: 14px;
            margin: 5px 0;
        }
        .row.total {
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            padding: 5px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        }
        .label {
            flex: 1;
        }
        .value {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .notes {
            background: #f5f5f5;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
            border-left: 3px solid #666;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #999;
        }
        @media print {
            body { padding: 10px; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">CIERRE DE CAJA</div>
        <div class="subtitle">${regLabel(closing.storeId, closing.registerId)}</div>
        <div class="subtitle">Turno: ${closing.shift.toUpperCase()}</div>
    </div>

    <div class="section">
        <div class="row">
            <span class="label">Fecha:</span>
            <span class="value">${fmtDate(closing.date)}</span>
        </div>
        <div class="row">
            <span class="label">Cerrado por:</span>
            <span class="value">${closing.closedBy}</span>
        </div>
        <div class="row">
            <span class="label">Hora de cierre:</span>
            <span class="value">${fmtTime(closing.closedAt)}</span>
        </div>
    </div>

    <div class="section">
        <div class="row highlight">
            <span class="label">Apertura:</span>
            <span class="value">${fmt(closing.openingAmount)}</span>
        </div>
    </div>

    <div class="section">
        <div class="row">
            <span class="label">Ingresos (efectivo):</span>
            <span class="value positive">+ ${fmt(closing.ingresosEfectivo)}</span>
        </div>
        <div class="row">
            <span class="label">Ingresos (total):</span>
            <span class="value positive">+ ${fmt(closing.ingresosTotal)}</span>
        </div>
        <div class="row">
            <span class="label">Egresos (efectivo):</span>
            <span class="value negative">- ${fmt(closing.egresosEfectivo)}</span>
        </div>
        <div class="row">
            <span class="label">Egresos (total):</span>
            <span class="value negative">- ${fmt(closing.egresosTotal)}</span>
        </div>
    </div>

    <div class="section">
        <div class="row highlight">
            <span class="label">Efectivo esperado:</span>
            <span class="value">${fmt(closing.expectedCash)}</span>
        </div>
        <div class="row highlight">
            <span class="label">Efectivo contado:</span>
            <span class="value">${fmt(closing.countedCash)}</span>
        </div>
        <div class="row total ${closing.difference === 0 ? '' : closing.difference > 0 ? 'positive' : 'negative'}">
            <span class="label">Diferencia:</span>
            <span class="value">${closing.difference >= 0 ? '+' : ''}${fmt(closing.difference)}</span>
        </div>
    </div>

    <div class="section">
        <div class="row highlight">
            <span class="label">Monto retirado:</span>
            <span class="value">${fmt(closing.montoRetirado)}</span>
        </div>
        ${closing.transferredOut > 0 ? `
        <div class="row">
            <span class="label">Transferido:</span>
            <span class="value negative">- ${fmt(closing.transferredOut)}</span>
        </div>` : ''}
        ${closing.adminWithdrawn > 0 ? `
        <div class="row">
            <span class="label">Retiros admin:</span>
            <span class="value negative">- ${fmt(closing.adminWithdrawn)}</span>
        </div>` : ''}
    </div>

    ${closing.notes ? `
    <div class="notes">
        <strong>Nota:</strong><br>
        ${closing.notes}
    </div>` : ''}

    <div class="footer">
        CajaControl - ${new Date().toLocaleString('es-AR')}
    </div>

    <div style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #0f172a; color: white; border: none; border-radius: 6px;">
            🖨️ Imprimir
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #94a3b8; color: white; border: none; border-radius: 6px; margin-left: 10px;">
            Cerrar
        </button>
    </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};

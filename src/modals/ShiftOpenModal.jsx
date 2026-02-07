import { useState } from "react";
import Modal from "../components/Modal";
import BillCounter from "../components/BillCounter";
import { calcBillTotal, calcCoinTotal, fmt } from "../utils/formatters";
import { S } from "../styles/styles";

export default function ShiftOpenModal({ data, onConfirm, onClose }) {
    const [bills, setBills] = useState({});
    const [coins, setCoins] = useState({});
    const total = calcBillTotal(bills) + calcCoinTotal(coins);
    return (
        <Modal title="Abrir Turno" onClose={onClose} wide>
            <p style={S.modalHint}>Contá el efectivo en la caja.</p>
            <BillCounter bills={bills} setBills={setBills} coins={coins} setCoins={setCoins} />
            <button style={S.btnSubmit} onClick={() => onConfirm(bills, coins)} disabled={total === 0}>Abrir con {fmt(total)}</button>
        </Modal>
    );
}

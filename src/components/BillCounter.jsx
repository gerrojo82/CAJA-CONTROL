import { useState } from "react";
import { DENOMINATIONS, COIN_DENOMS } from "../utils/constants";
import { calcBillTotal, calcCoinTotal, fmt } from "../utils/formatters";
import { S } from "../styles/styles";

export default function BillCounter({ bills, setBills, coins, setCoins }) {
    const billTotal = calcBillTotal(bills);
    const coinTotal = calcCoinTotal(coins);
    const [showCoins, setShowCoins] = useState(false);
    return (
        <div>
            <div style={S.countHeader}><span style={S.countLabel}>Billetes</span><span style={S.countTotal}>{fmt(billTotal)}</span></div>
            <div style={S.denomGrid}>
                {DENOMINATIONS.map(d => (
                    <div key={d} style={S.denomRow}>
                        <span style={S.denomValue}>{fmt(d)}</span>
                        <div style={S.denomInputWrap}>
                            <button style={S.denomBtn} onClick={() => setBills({ ...bills, [d]: Math.max(0, (bills[d] || 0) - 1) })}>−</button>
                            <input style={S.denomInput} type="number" min="0" value={bills[d] || ""} onChange={e => setBills({ ...bills, [d]: Math.max(0, parseInt(e.target.value) || 0) })} placeholder="0" />
                            <button style={S.denomBtn} onClick={() => setBills({ ...bills, [d]: (bills[d] || 0) + 1 })}>+</button>
                        </div>
                        <span style={S.denomSubtotal}>{fmt((bills[d] || 0) * d)}</span>
                    </div>
                ))}
            </div>
            <button style={S.toggleCoins} onClick={() => setShowCoins(!showCoins)}>{showCoins ? "▾ Ocultar monedas" : "▸ Monedas"}</button>
            {showCoins && <>
                <div style={{ ...S.countHeader, marginTop: 6 }}><span style={S.countLabel}>Monedas</span><span style={S.countTotal}>{fmt(coinTotal)}</span></div>
                <div style={S.denomGrid}>
                    {COIN_DENOMS.map(d => (
                        <div key={`c${d}`} style={S.denomRow}>
                            <span style={S.denomValue}>{fmt(d)}</span>
                            <div style={S.denomInputWrap}>
                                <button style={S.denomBtn} onClick={() => setCoins({ ...coins, [d]: Math.max(0, (coins[d] || 0) - 1) })}>−</button>
                                <input style={S.denomInput} type="number" min="0" value={coins[d] || ""} onChange={e => setCoins({ ...coins, [d]: Math.max(0, parseInt(e.target.value) || 0) })} placeholder="0" />
                                <button style={S.denomBtn} onClick={() => setCoins({ ...coins, [d]: (coins[d] || 0) + 1 })}>+</button>
                            </div>
                            <span style={S.denomSubtotal}>{fmt((coins[d] || 0) * d)}</span>
                        </div>
                    ))}
                </div>
            </>}
            <div style={S.grandTotal}><span>TOTAL CONTADO</span><span style={S.grandTotalVal}>{fmt(billTotal + coinTotal)}</span></div>
        </div>
    );
}

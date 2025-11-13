import React, { useMemo, useState } from "react";
import "./styles.css";

function clampDisplay(str, maxLen = 12) {
  if (str.length <= maxLen) return str;
  // If it's very long, keep as is but cut visually; avoid regex usage.
  return str.slice(0, maxLen);
}

function toNumber(valueStr) {
  const n = Number(valueStr);
  if (Number.isNaN(n)) return 0;
  return n;
}

function roundToPrecision(num, precision = 12) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

function formatOutput(str) {
  // Keep raw if decimal present to avoid locale artifacts; otherwise allow locale for integers
  if (str.includes(".")) return str;
  const n = Number(str);
  if (!Number.isFinite(n)) return str;
  try {
    return n.toLocaleString("ru-RU");
  } catch (_) {
    return str;
  }
}

const operators = {
  add: "+",
  sub: "-",
  mul: "×",
  div: "÷",
};

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState(null); // number | null
  const [op, setOp] = useState(null); // 'add' | 'sub' | 'mul' | 'div' | null
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [lastSecond, setLastSecond] = useState(null); // for repeated '='

  const acMode = useMemo(() => display === "0" && !firstOperand && !op && !waitingForSecond, [display, firstOperand, op, waitingForSecond]);

  function inputDigit(d) {
    if (waitingForSecond) {
      setDisplay(String(d));
      setWaitingForSecond(false);
      return;
    }
    if (display === "0") {
      setDisplay(String(d));
    } else {
      const next = display + String(d);
      setDisplay(clampDisplay(next));
    }
  }

  function inputDecimal() {
    if (waitingForSecond) {
      setDisplay("0.");
      setWaitingForSecond(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }

  function compute(a, b, operatorKey) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
    let res = 0;
    if (operatorKey === "add") res = a + b;
    else if (operatorKey === "sub") res = a - b;
    else if (operatorKey === "mul") res = a * b;
    else if (operatorKey === "div") {
      if (b === 0) return Infinity; // handle later as error
      res = a / b;
    }
    return roundToPrecision(res);
  }

  function handleOperator(nextOp) {
    const current = toNumber(display);

    if (op && waitingForSecond) {
      // change the operator without computing
      setOp(nextOp);
      return;
    }

    if (firstOperand == null) {
      setFirstOperand(current);
    } else if (op) {
      const res = compute(firstOperand, current, op);
      if (!Number.isFinite(res)) {
        setDisplay("Ошибка");
        setFirstOperand(null);
        setOp(null);
        setWaitingForSecond(false);
        setLastSecond(null);
        return;
      }
      setFirstOperand(res);
      setDisplay(String(res));
      setLastSecond(current);
    }

    setOp(nextOp);
    setWaitingForSecond(true);
  }

  function handleEquals() {
    const current = toNumber(display);
    if (op == null) return;

    let second = current;
    if (waitingForSecond) {
      // repeat last operation when '=' is pressed repeatedly
      if (lastSecond != null) {
        second = lastSecond;
      } else if (firstOperand != null) {
        second = firstOperand;
      }
    }

    const a = firstOperand == null ? 0 : firstOperand;
    const res = compute(a, second, op);
    if (!Number.isFinite(res)) {
      setDisplay("Ошибка");
      setFirstOperand(null);
      setOp(null);
      setWaitingForSecond(false);
      setLastSecond(null);
      return;
    }

    setDisplay(String(res));
    setFirstOperand(res);
    setWaitingForSecond(false);
    setLastSecond(second);
  }

  function handlePercent() {
    let current = toNumber(display);
    if (op && firstOperand != null && !waitingForSecond) {
      // iPhone-like: make current be a percent of firstOperand
      current = (firstOperand * current) / 100;
    } else {
      current = current / 100;
    }
    current = roundToPrecision(current);
    setDisplay(String(current));
  }

  function handleSign() {
    if (display === "0") return;
    if (display.startsWith("-")) setDisplay(display.slice(1));
    else setDisplay("-" + display);
  }

  function handleClear() {
    if (!acMode) {
      // C: clear entry only
      setDisplay("0");
      return;
    }
    // AC: full reset
    setDisplay("0");
    setFirstOperand(null);
    setOp(null);
    setWaitingForSecond(false);
    setLastSecond(null);
  }

  const shown = formatOutput(display);

  return (
    <div className="calc" data-easytag="id1-react/src/components/Calculator/index.jsx">
      <div className="calc-display" aria-label="Экран калькулятора" data-easytag="id2-react/src/components/Calculator/index.jsx">
        {shown}
      </div>
      <div className="calc-keys" data-easytag="id3-react/src/components/Calculator/index.jsx">
        <button className="btn btn-action" onClick={handleClear} aria-label={acMode ? "Очистить всё" : "Стереть ввод"} data-easytag="id4-react/src/components/Calculator/index.jsx">{acMode ? "AC" : "C"}</button>
        <button className="btn btn-action" onClick={handleSign} aria-label="Плюс-минус" data-easytag="id5-react/src/components/Calculator/index.jsx">±</button>
        <button className="btn btn-action" onClick={handlePercent} aria-label="Процент" data-easytag="id6-react/src/components/Calculator/index.jsx">%</button>
        <button className="btn btn-operator" onClick={() => handleOperator("div")} aria-label="Деление" data-easytag="id7-react/src/components/Calculator/index.jsx">{operators.div}</button>

        <button className="btn btn-digit" onClick={() => inputDigit(7)} data-easytag="id8-react/src/components/Calculator/index.jsx">7</button>
        <button className="btn btn-digit" onClick={() => inputDigit(8)} data-easytag="id9-react/src/components/Calculator/index.jsx">8</button>
        <button className="btn btn-digit" onClick={() => inputDigit(9)} data-easytag="id10-react/src/components/Calculator/index.jsx">9</button>
        <button className="btn btn-operator" onClick={() => handleOperator("mul")} aria-label="Умножение" data-easytag="id11-react/src/components/Calculator/index.jsx">{operators.mul}</button>

        <button className="btn btn-digit" onClick={() => inputDigit(4)} data-easytag="id12-react/src/components/Calculator/index.jsx">4</button>
        <button className="btn btn-digit" onClick={() => inputDigit(5)} data-easytag="id13-react/src/components/Calculator/index.jsx">5</button>
        <button className="btn btn-digit" onClick={() => inputDigit(6)} data-easytag="id14-react/src/components/Calculator/index.jsx">6</button>
        <button className="btn btn-operator" onClick={() => handleOperator("sub")} aria-label="Вычитание" data-easytag="id15-react/src/components/Calculator/index.jsx">{operators.sub}</button>

        <button className="btn btn-digit" onClick={() => inputDigit(1)} data-easytag="id16-react/src/components/Calculator/index.jsx">1</button>
        <button className="btn btn-digit" onClick={() => inputDigit(2)} data-easytag="id17-react/src/components/Calculator/index.jsx">2</button>
        <button className="btn btn-digit" onClick={() => inputDigit(3)} data-easytag="id18-react/src/components/Calculator/index.jsx">3</button>
        <button className="btn btn-operator" onClick={() => handleOperator("add")} aria-label="Сложение" data-easytag="id19-react/src/components/Calculator/index.jsx">{operators.add}</button>

        <button className="btn btn-digit btn-zero" onClick={() => inputDigit(0)} data-easytag="id20-react/src/components/Calculator/index.jsx">0</button>
        <button className="btn btn-digit" onClick={inputDecimal} data-easytag="id21-react/src/components/Calculator/index.jsx">,</button>
        <button className="btn btn-operator" onClick={handleEquals} aria-label="Равно" data-easytag="id22-react/src/components/Calculator/index.jsx">=</button>
      </div>
    </div>
  );
}

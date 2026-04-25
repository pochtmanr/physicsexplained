import styles from "./equation-drift.module.css";

const ITEMS: Array<{
  eq: string;
  top: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
}> = [
  { eq: "F = ma", top: "12%", left: "8%", delay: "0s", duration: "26s", size: "16px" },
  { eq: "E = mc²", top: "30%", left: "62%", delay: "-6s", duration: "30s", size: "13px" },
  { eq: "∇·E = ρ/ε₀", top: "70%", left: "18%", delay: "-12s", duration: "28s", size: "14px" },
  { eq: "iℏ ∂ψ/∂t = Ĥψ", top: "55%", left: "70%", delay: "-3s", duration: "24s", size: "12px" },
  { eq: "S = k_B ln Ω", top: "82%", left: "55%", delay: "-9s", duration: "30s", size: "13px" },
  { eq: "λ = h/p", top: "20%", left: "38%", delay: "-15s", duration: "26s", size: "15px" },
  { eq: "PV = nRT", top: "78%", left: "8%", delay: "-20s", duration: "28s", size: "12px" },
  { eq: "F = G m₁m₂/r²", top: "8%", left: "75%", delay: "-7s", duration: "32s", size: "13px" },
  { eq: "∮ B·dA = 0", top: "45%", left: "10%", delay: "-22s", duration: "30s", size: "14px" },
];

export function EquationDrift() {
  return (
    <div aria-hidden="true" className={styles.root}>
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className={styles.eq}
          style={{
            top: item.top,
            left: item.left,
            fontSize: item.size,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.eq}
        </span>
      ))}
    </div>
  );
}

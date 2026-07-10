import React from "react";

interface DuplicateAlert {
  is_duplicate: boolean;
  reason: string;
  original_date: string | null;
  confidence?: string;
}

interface AnomalyAlertItem {
  type: string;
  severity: string;
  message: string;
  avg_historical?: number;
  current?: number;
  pct_above_avg?: number;
}

interface AnomalyAlert {
  has_anomaly: boolean;
  alerts: AnomalyAlertItem[];
  history_count?: number;
  avg_historical_amount?: number;
  invoices_analyzed?: number;
}

interface Props {
  duplicateAlert?: DuplicateAlert;
  anomalyAlert?: AnomalyAlert;
}

export default function IntelligenceAlerts({ duplicateAlert, anomalyAlert }: Props) {
  const hasDuplicate = duplicateAlert?.is_duplicate;
  const hasAnomaly = anomalyAlert?.has_anomaly;

  if (!hasDuplicate && !hasAnomaly) {
    if (anomalyAlert && anomalyAlert.history_count !== undefined && anomalyAlert.history_count > 0) {
      return (
        <div style={styles.cleanBox}>
          <span style={styles.cleanIcon}>✅</span>
          <div>
            <strong>No anomalies detected.</strong>
            <div style={styles.subtext}>
              Compared against {anomalyAlert.invoices_analyzed} past invoices from this vendor
              (avg ₹{anomalyAlert.avg_historical_amount?.toLocaleString()})
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      {hasDuplicate && (
        <div style={styles.duplicateBox}>
          <span style={styles.icon}>🔴</span>
          <div>
            <strong>Possible Duplicate Invoice</strong>
            <div style={styles.subtext}>{duplicateAlert!.reason}</div>
            {duplicateAlert!.confidence && (
              <span style={styles.badge}>{duplicateAlert!.confidence} confidence</span>
            )}
          </div>
        </div>
      )}

      {hasAnomaly &&
        anomalyAlert!.alerts.map((alert, idx) => (
          <div
            key={idx}
            style={alert.severity === "HIGH" ? styles.highAlertBox : styles.medAlertBox}
          >
            <span style={styles.icon}>{alert.severity === "HIGH" ? "🔴" : "🟡"}</span>
            <div>
              <strong>Vendor Anomaly Detected</strong>
              <div style={styles.subtext}>{alert.message}</div>
              {anomalyAlert!.invoices_analyzed && (
                <span style={styles.badge}>
                  Based on {anomalyAlert!.invoices_analyzed} historical invoices
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  duplicateBox: {
    display: "flex",
    gap: 12,
    background: "linear-gradient(135deg, #3b0000, #1a0000)",
    border: "1px solid #ff4444",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    color: "#fff",
  },
  highAlertBox: {
    display: "flex",
    gap: 12,
    background: "linear-gradient(135deg, #3b0000, #1a0000)",
    border: "1px solid #ff4444",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    color: "#fff",
  },
  medAlertBox: {
    display: "flex",
    gap: 12,
    background: "linear-gradient(135deg, #2a2200, #1a1500)",
    border: "1px solid #ffaa00",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    color: "#fff",
  },
  cleanBox: {
    display: "flex",
    gap: 12,
    background: "linear-gradient(135deg, #003b00, #001a00)",
    border: "1px solid #44ff44",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    color: "#fff",
  },
  icon: { fontSize: 20 },
  cleanIcon: { fontSize: 20 },
  subtext: { fontSize: 13, color: "#cbd5e1", marginTop: 4 },
  badge: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(255,255,255,0.1)",
  },
};
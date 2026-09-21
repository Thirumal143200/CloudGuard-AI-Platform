# CloudGuard AI — Machine Learning Design Document

**Version:** 2.0  
**Core Model:** Multi-Variate Isolation Forest & Statistical Baseline Deviation Engine  

---

## 1. Machine Learning Objectives

1. Detect anomalous cloud activity in CloudTrail and VPC Flow Logs (e.g., off-hours activity, anomalous API velocity, unfamiliar IP addresses).
2. Quantify behavioral deviation as a normalized numeric metric (`0.0` to `100.0`) for real-time risk scoring.
3. Automatically correlate anomalous telemetry events into high-priority Incident forensic cases.

---

## 2. Feature Vector Engineering

Each cloud activity event is mapped into a 6-dimensional numeric feature vector:

$$\mathbf{x} = [x_1, x_2, x_3, x_4, x_5, x_6]$$

| Feature Index | Name | Range | Description |
|---|---|---|---|
| $x_1$ | `hour_of_day` | `0.0 - 23.0` | Exact hour of API invocation |
| $x_2$ | `is_off_hours` | `{0.0, 1.0}` | Binary flag: `1.0` if hour is between 20:00 - 06:00 |
| $x_3$ | `event_risk_tier` | `{1.0, 2.0, 3.0}` | 3=Admin/Privilege mutation, 2=Error/Deny, 1=Read |
| $x_4$ | `error_rate_flag` | `{0.0, 1.0}` | Binary indicator of non-200 HTTP response |
| $x_5$ | `ip_novelty_score` | `0.0 - 1.0` | Jaccard distance from historically observed CIDRs |
| $x_6$ | `privilege_intent` | `{0.0, 1.0}` | Ingress creation, policy attachment, or trail tampering |

---

## 3. Isolation Forest Mathematical Formulation

Isolation Forest operates by constructing ensembles of random isolation trees (iTrees). Anomalies require fewer random splits to isolate than normal cluster instances:

$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$

Where $h(x)$ is the path length to isolate sample $x$, $E(h(x))$ is the average path length across all trees, and $c(n)$ is the average path length of unsuccessful searches in a Binary Search Tree with $n$ samples:

$$c(n) = 2 \ln(n - 1) + 0.5772156649 - \frac{2(n-1)}{n}$$

When $s(x, n) \to 1.0$, the instance is classified as a critical telemetry anomaly.

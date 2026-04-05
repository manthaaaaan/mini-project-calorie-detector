import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

import {
  analyzeMeal,
  deleteMeal,
  fetchDashboard,
  fetchGoal,
  fetchMeals,
  updateGoal,
  updateMeal,
} from "./api/client";

const BACKEND = "https://mini-project-calorie-detector-production.up.railway.app";

const isoToday = () => new Date().toISOString();

const tabs = [
  { key: "home", label: "Home" },
  { key: "scan", label: "Scan" },
  { key: "history", label: "History" },
  { key: "profile", label: "Profile" },
];

function getGoalStatus(consumed, goal, goalType) {
  if (!consumed || !goal) return null;
  if (goalType === "cut") {
    if (consumed > goal * 1.05) return { type: "over",  message: "🍕 Oops! You over ate for your cut goal today." };
    if (consumed >= goal * 0.9) return { type: "hit",   message: "🎉 Yay! You nailed your cut goal today!" };
    return { type: "under", message: `🔥 ${goal - Math.round(consumed)} kcal left to hit your cut goal.` };
  }
  if (goalType === "bulk") {
    if (consumed >= goal)        return { type: "hit",   message: "💪 Yay! You hit your bulk goal today!" };
    if (consumed >= goal * 0.9)  return { type: "close", message: `📈 Almost there! ${goal - Math.round(consumed)} kcal more to bulk.` };
    return { type: "under", message: `🍗 Eat more! ${goal - Math.round(consumed)} kcal left for your bulk.` };
  }
  if (consumed > goal * 1.05)  return { type: "over",  message: "😬 You over ate today. Balance it tomorrow!" };
  if (consumed >= goal * 0.95) return { type: "hit",   message: "✨ Yay! You maintained your calories perfectly!" };
  return { type: "under", message: `⚡ ${goal - Math.round(consumed)} kcal remaining for today.` };
}

function shouldCelebrate(consumed, goal, goalType) {
  if (!consumed || !goal) return false;
  if (goalType === "cut")  return consumed >= goal && consumed <= goal * 1.05;
  if (goalType === "bulk") return consumed >= goal;
  return consumed >= goal * 0.95 && consumed <= goal * 1.05;
}

function NavIcon({ name }) {
  const icons = {
    home: <path d="M4 10.5L12 4l8 6.5V20h-5v-6h-6v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    scan: <path d="M7 4H4v3M17 4h3v3M7 20H4v-3M20 17v3h-3M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    history: <path d="M12 7v5l3 2M21 12a9 9 0 10-2.64 6.36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    profile: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>;
}

function CalorieRing({ consumed, goal, goalType }) {
  const progress = Math.min(Math.max((consumed / goal) * 100, 0), 100);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isOver = consumed > goal * 1.05;
  const ringColors =
    goalType === "cut" && isOver ? ["#f472b6", "#ef4444"]
    : goalType === "bulk"        ? ["#34d399", "#22d3ee"]
    :                              ["#8a7dff", "#43ddff"];

  return (
    <div className="calorie-ring-wrap">
      <svg className="calorie-ring" width="170" height="170">
        <defs>
          <linearGradient id="ringNeon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringColors[0]} />
            <stop offset="100%" stopColor={ringColors[1]} />
          </linearGradient>
        </defs>
        <circle cx="85" cy="85" r={radius} className="ring-track" />
        <motion.circle
          cx="85" cy="85" r={radius}
          className="ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="ring-center">
        <strong>{Math.round(consumed)}</strong>
        <span>of {goal} kcal</span>
      </div>
    </div>
  );
}

export default function App({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState("home");
  const [dashboard, setDashboard] = useState(null);
  const [meals, setMeals] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [goalDraft, setGoalDraft] = useState(2000);
  const [scanning, setScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestDetection, setLatestDetection] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);

  const [goalType, setGoalType] = useState(
    () => localStorage.getItem("goalType") || "lean"
  );

  const date = useMemo(isoToday, []);

  const refreshAll = async () => {
    setError("");
    const [dashboardData, mealsData, goalData] = await Promise.all([
      fetchDashboard(date),
      fetchMeals(date),
      fetchGoal(),
    ]);
    setDashboard(dashboardData);
    setMeals(mealsData);
    setGoal(goalData.calories_goal);
    setGoalDraft(goalData.calories_goal);

    if (mealsData && mealsData.length > 0) {
      const latest = mealsData[0];
      setLatestDetection({
        name: latest.name,
        calories: latest.calories,
        protein: latest.protein,
        carbs: latest.carbs,
        fats: latest.fats,
        image_path: latest.image_path,
      });
    }

    // Build weekly data — only today is real, rest are 0 placeholders
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return { day: days[d.getDay()], calories: 0, isToday: i === 6 };
    });
    weekly[6].calories = dashboardData.consumed_calories;
    setWeeklyData(weekly);
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!dashboard) return;
    const celebrate = shouldCelebrate(dashboard.consumed_calories, goal, goalType);
    if (celebrate && !confettiFired) {
      setShowConfetti(true);
      setConfettiFired(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
    if (!celebrate) setConfettiFired(false);
  }, [dashboard, goal, goalType, confettiFired]);

  const handlePickFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setLatestDetection(null);
    setScanning(true);
    setError("");
    try {
      const result = await analyzeMeal(file);
      const mainDish = result.detections.reduce((prev, curr) =>
        curr.calories > prev.calories ? curr : prev
      , result.detections[0]);
      setLatestDetection(mainDish || null);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Image scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleGoalSave = async (overrideValue) => {
    try {
      const nextGoal = Number(overrideValue ?? goalDraft);
      const payload = await updateGoal(nextGoal);
      setGoal(payload.calories_goal);
      setGoalDraft(payload.calories_goal);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update goal");
    }
  };

  const startEdit = (meal) => {
    setEditingId(meal.id);
    setEditDraft({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats, quantity: meal.quantity });
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    await handleUpdateMeal(editingId, {
      ...editDraft,
      calories: Number(editDraft.calories),
      protein: Number(editDraft.protein),
      carbs: Number(editDraft.carbs),
      fats: Number(editDraft.fats),
      quantity: Number(editDraft.quantity),
    });
    setEditingId(null);
    setEditDraft(null);
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await deleteMeal(mealId);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete meal");
    }
  };

  const handleUpdateMeal = async (mealId, payload) => {
    try {
      await updateMeal(mealId, payload);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update meal");
    }
  };

  const renderHome = () => {
    const status = getGoalStatus(dashboard.consumed_calories, goal, goalType);
    const statusColors = {
      hit:   { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)",  color: "#6ee7b7" },
      over:  { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.35)",   color: "#fca5a5" },
      under: { bg: "rgba(124,92,252,0.1)",  border: "rgba(124,92,252,0.35)",  color: "#c4b5fd" },
      close: { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.35)",  color: "#fde68a" },
    };
    const sc = status ? statusColors[status.type] : null;

    return (
      <>
        <motion.section className="glass-card hero-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Today</h2>
          <CalorieRing consumed={dashboard.consumed_calories} goal={goal} goalType={goalType} />

          {status && (
            <motion.div
              key={status.message}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                margin: "0 auto 14px", padding: "9px 18px", borderRadius: 999,
                background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                fontSize: "0.82rem", fontWeight: 600, textAlign: "center", maxWidth: 290,
              }}
            >
              {status.message}
            </motion.div>
          )}

          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "3px 12px", borderRadius: 999,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.38)",
            }}>
              {goalType === "cut" ? "✂️ Cut Mode" : goalType === "bulk" ? "💪 Bulk Mode" : "⚖️ Lean Mode"}
            </span>
          </div>

          <div className="macro-pill-row">
            <span className="pill protein">Protein {dashboard.protein.toFixed(1)}g</span>
            <span className="pill carbs">Carbs {dashboard.carbs.toFixed(1)}g</span>
            <span className="pill fats">Fats {dashboard.fats.toFixed(1)}g</span>
          </div>
        </motion.section>

        {/* Latest Scan */}
        <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="card-header-inline">
            <h3>Latest Scan</h3>
            <button className="mini-btn" onClick={() => setActiveTab("scan")}>Scan New</button>
          </div>
          {latestDetection ? (
            <motion.div className="scan-result" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {latestDetection.image_path && (
                <img
                  src={`${BACKEND}/uploads/${latestDetection.image_path.split(/[\\/]/).pop()}`}
                  alt={latestDetection.name}
                  style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(138,125,255,0.4)", flexShrink: 0 }}
                />
              )}
              <div>
                <h4>{latestDetection.name}</h4>
                <p>{Math.round(latestDetection.calories)} kcal</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  <span className="pill protein" style={{ fontSize: 10, padding: "2px 8px" }}>P {latestDetection.protein.toFixed(1)}g</span>
                  <span className="pill carbs" style={{ fontSize: 10, padding: "2px 8px" }}>C {latestDetection.carbs.toFixed(1)}g</span>
                  <span className="pill fats" style={{ fontSize: 10, padding: "2px 8px" }}>F {latestDetection.fats.toFixed(1)}g</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
              <p className="muted" style={{ margin: 0 }}>No scan yet today.</p>
              <button className="mini-btn" style={{ marginTop: 12 }} onClick={() => setActiveTab("scan")}>Scan Food</button>
            </motion.div>
          )}
        </motion.section>

        {/* Weekly Calories Chart */}
        <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ marginBottom: 16 }}>This Week</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} barSize={28} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#fff",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                formatter={(v) => [`${Math.round(v)} kcal`, ""]}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? "#8a7dff" : "rgba(138,125,255,0.2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 6 }}>
            Today highlighted in purple
          </p>
        </motion.section>
      </>
    );
  };

  const renderScan = () => (
    <motion.section className="glass-card scan-page-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <h2>AI Food Scan</h2>
      <p className="muted">Tap the glowing button to capture or upload food.</p>

      <label className="camera-button-wrap">
        <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePickFile(e.target.files?.[0])} />
        <motion.div className="camera-button" animate={{ scale: scanning ? [1, 1.06, 1] : 1 }} transition={{ repeat: scanning ? Infinity : 0, duration: 1.1 }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h4l1.5-2h5L16 8h4v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </motion.div>
        {scanning && <span className="laser" />}
      </label>

      <AnimatePresence>
        {previewUrl && (
          <motion.div
            className="scan-circle-wrap"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
          >
            <div className="scan-circle-ring-area">
              <div className="scan-circle-img-wrap">
                <img src={previewUrl} alt="Food preview" className="scan-circle-img" />
                {scanning && (
                  <motion.div className="scan-circle-overlay" animate={{ opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
              </div>
              {scanning && (
                <>
                  <div className="scan-ring scan-ring-outer">
                    <motion.div className="scan-ring-spin" animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} />
                  </div>
                  <div className="scan-ring scan-ring-inner">
                    <motion.div className="scan-ring-spin" animate={{ rotate: -360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} />
                  </div>
                </>
              )}
              {!scanning && latestDetection && <div className="scan-ring scan-ring-success" />}
            </div>
            <motion.p className="scan-circle-label" key={scanning ? "scanning" : latestDetection ? "done" : "idle"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              {scanning ? "Analyzing..." : latestDetection ? "✓ Detected" : ""}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {latestDetection && (
        <motion.div className="glass-inner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h4>{latestDetection.name}</h4>
          <p className="detect-kcal">{Math.round(latestDetection.calories)} kcal</p>
          <div className="macro-pill-row stacked">
            <span className="pill protein">Protein {latestDetection.protein.toFixed(1)}g</span>
            <span className="pill carbs">Carbs {latestDetection.carbs.toFixed(1)}g</span>
            <span className="pill fats">Fats {latestDetection.fats.toFixed(1)}g</span>
          </div>
        </motion.div>
      )}
    </motion.section>
  );

  const renderHistory = () => (
    <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Meal History</h2>
      <div className="list-stack">
        {meals.map((meal) => (
          <motion.article className="meal-item" key={meal.id} layout>
            {editingId === meal.id ? (
              <div className="edit-grid">
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: -8 }}>Meal Name</label>
                <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: -8 }}>Calories (kcal)</label>
                <input type="number" value={editDraft.calories} onChange={(e) => setEditDraft({ ...editDraft, calories: e.target.value })} />
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: -8 }}>Protein (g)</label>
                <input type="number" value={editDraft.protein} onChange={(e) => setEditDraft({ ...editDraft, protein: e.target.value })} />
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: -8 }}>Carbs (g)</label>
                <input type="number" value={editDraft.carbs} onChange={(e) => setEditDraft({ ...editDraft, carbs: e.target.value })} />
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: -8 }}>Fats (g)</label>
                <input type="number" value={editDraft.fats} onChange={(e) => setEditDraft({ ...editDraft, fats: e.target.value })} />
                <div className="row-actions">
                  <button className="mini-btn" onClick={saveEdit}>Save</button>
                  <button className="mini-btn danger" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                {meal.image_path ? (
                  <img
                    src={`${BACKEND}/uploads/${meal.image_path.split(/[\\/]/).pop()}`}
                    alt={meal.name}
                    style={{
                      width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0,
                      border: "1px solid rgba(138,125,255,0.3)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: "rgba(138,125,255,0.1)", border: "1px solid rgba(138,125,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>🍽️</div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{meal.name}</h4>
                  <p style={{ margin: 0 }}>{Math.round(meal.calories)} kcal</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                    {new Date(meal.created_at + "Z").toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
                <div className="row-actions">
                  <button className="mini-btn" onClick={() => startEdit(meal)}>Edit</button>
                  <button className="mini-btn danger" onClick={() => handleDeleteMeal(meal.id)}>Delete</button>
                </div>
              </div>
            )}
          </motion.article>
        ))}

        {!meals.length && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🍱</div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, margin: 0 }}>No meals logged yet</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 6 }}>Scan your first meal to get started!</p>
            <button className="mini-btn" style={{ marginTop: 16 }} onClick={() => setActiveTab("scan")}>Scan Now</button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );

  const renderProfile = () => (
    <>
      {/* Profile Header */}
      <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={user?.photoURL}
            alt="Profile"
            style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid rgba(138,125,255,0.5)", objectFit: "cover" }}
          />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>{user?.displayName}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{user?.email}</p>
          </div>
          <button className="mini-btn danger" onClick={onSignOut}>Sign Out</button>
        </div>
      </motion.section>

      {/* Daily Goal */}
      <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <h2>Daily Goal</h2>
        <div className="goal-row">
          <input type="number" value={goalDraft} min="1" onChange={(e) => setGoalDraft(e.target.value)} />
          <button className="mini-btn" onClick={() => handleGoalSave()}>Save Goal</button>
        </div>
      </motion.section>

      {/* Calorie Calculator */}
      <motion.section className="glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2>Calorie Calculator</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Age</label>
              <input type="number" placeholder="25" id="calc-age"
                style={{ width: "100%", marginTop: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Gender</label>
              <select id="calc-gender"
                style={{ width: "100%", marginTop: 4, background: "rgba(30,30,50,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Height (cm)</label>
              <input type="number" placeholder="175" id="calc-height"
                style={{ width: "100%", marginTop: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Weight (kg)</label>
              <input type="number" placeholder="70" id="calc-weight"
                style={{ width: "100%", marginTop: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Activity Level</label>
            <select id="calc-activity"
              style={{ width: "100%", marginTop: 4, background: "rgba(30,30,50,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }}>
              <option value="1.2">Sedentary (little/no exercise)</option>
              <option value="1.375">Lightly Active (1-3 days/week)</option>
              <option value="1.55">Moderately Active (3-5 days/week)</option>
              <option value="1.725">Very Active (6-7 days/week)</option>
              <option value="1.9">Super Active (athlete)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Goal</label>
            <select id="calc-goal"
              style={{ width: "100%", marginTop: 4, background: "rgba(30,30,50,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14 }}>
              <option value="cut">Cut (Lose Fat)</option>
              <option value="lean">Lean (Maintain)</option>
              <option value="bulk">Bulk (Gain Muscle)</option>
            </select>
          </div>

          <button className="mini-btn" style={{ padding: "12px", fontSize: 14, width: "100%" }}
            onClick={() => {
              const age = Number(document.getElementById("calc-age").value);
              const gender = document.getElementById("calc-gender").value;
              const height = Number(document.getElementById("calc-height").value);
              const weight = Number(document.getElementById("calc-weight").value);
              const activity = Number(document.getElementById("calc-activity").value);
              const selectedGoalType = document.getElementById("calc-goal").value;
              if (!age || !height || !weight) { alert("Please fill in all fields"); return; }
              let bmr = gender === "male"
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161;
              const tdee = Math.round(bmr * activity);
              const target = selectedGoalType === "cut" ? tdee - 500 : selectedGoalType === "bulk" ? tdee + 500 : tdee;
              document.getElementById("calc-result").style.display = "block";
              document.getElementById("calc-tdee").textContent = tdee;
              document.getElementById("calc-target").textContent = target;
              document.getElementById("calc-goal-label").textContent =
                selectedGoalType === "cut" ? "Cut (-500 kcal)" : selectedGoalType === "bulk" ? "Bulk (+500 kcal)" : "Lean (Maintain)";
            }}
          >
            Calculate
          </button>

          <div id="calc-result"
            style={{ display: "none", background: "rgba(138,125,255,0.08)", border: "1px solid rgba(138,125,255,0.2)", borderRadius: 12, padding: 16, marginTop: 4 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>Your Results</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Maintenance (TDEE)</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}><span id="calc-tdee"></span> kcal</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}><span id="calc-goal-label"></span></span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#8a7dff" }}><span id="calc-target"></span> kcal</span>
            </div>
            <button className="mini-btn" style={{ width: "100%", padding: "10px", fontSize: 13 }}
              onClick={() => {
                const target = Number(document.getElementById("calc-target").textContent);
                const selectedGoalType = document.getElementById("calc-goal").value;
                setGoalType(selectedGoalType);
                localStorage.setItem("goalType", selectedGoalType);
                setGoalDraft(target);
                handleGoalSave(target);
                alert(`Daily goal set to ${target} kcal (${selectedGoalType} mode)!`);
              }}
            >
              Set as My Daily Goal
            </button>
          </div>
        </div>
      </motion.section>
    </>
  );

  return (
    <div className="mobile-app">
      {showConfetti && <Confetti recycle={false} numberOfPieces={250} gravity={0.17} />}
      <div className="bg-layer" />
      <main className="phone-shell">
        <motion.header className="app-head" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1>CalorieAI</h1>
          <p>Premium Nutrition Coach</p>
        </motion.header>

        {error && <p className="error-banner">{error}</p>}

        <section className="content-stack">
          {isLoading || !dashboard ? (
            <>
              <div className="glass-card skeleton" />
              <div className="glass-card skeleton" />
              <div className="glass-card skeleton" />
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {activeTab === "home" && renderHome()}
                {activeTab === "scan" && renderScan()}
                {activeTab === "history" && renderHistory()}
                {activeTab === "profile" && renderProfile()}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        <nav className="bottom-nav">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab(tab.key)}>
              <NavIcon name={tab.key} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
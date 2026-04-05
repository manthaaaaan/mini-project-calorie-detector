import { motion } from "framer-motion";

export default function ProgressRing({ consumed, goal, progress }) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <motion.div
      className="progress-wrap"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <svg className="progress-ring" width="190" height="190">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b486ff" />
            <stop offset="100%" stopColor="#5ae6ff" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="95" cy="95" r={radius} />
        <motion.circle
          className="ring-value"
          cx="95"
          cy="95"
          r={radius}
          stroke="url(#ringGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="progress-center">
        <span className="progress-kcal">{Math.round(consumed)}</span>
        <span className="progress-label">of {goal} kcal</span>
      </div>
    </motion.div>
  );
}

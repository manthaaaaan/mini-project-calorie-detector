import { motion } from "framer-motion";

export default function ScanCard({ scanning, onPickFile }) {
  return (
    <motion.div
      className="glass-card scan-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
    >
      <h2>AI Food Scanner</h2>
      <p>Take a photo or upload a food image for instant macro breakdown.</p>
      <label className="scan-dropzone">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
        <span>{scanning ? "Scanning meal..." : "Tap to Capture or Upload"}</span>
        {scanning && <div className="scanner-laser" />}
      </label>
    </motion.div>
  );
}

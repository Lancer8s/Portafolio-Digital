

import { motion, AnimatePresence } from "framer-motion";

const variants = {
  initial:  { opacity: 0, y: 24 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function PageTransition({ children, pageKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: "100%", minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
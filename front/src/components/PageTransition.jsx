

import { motion, AnimatePresence } from "framer-motion";

const variants = {
  initial:  { opacity: 0, y: 4 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.08, ease: "easeOut" } },
  exit:     { opacity: 0, y: -4, transition: { duration: 0.05, ease: "easeIn" } },
};

export default function PageTransition({ children, pageKey }) {
  return (
    <AnimatePresence mode="sync">
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
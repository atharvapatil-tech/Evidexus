import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.webp";

interface SplashScreenProps {
  show: boolean;
}

const SplashScreen = ({ show }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <img src={logo} alt="Evidexus" className="h-14 w-14 object-contain mb-4" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">EVIDEXUS</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">Clinical Evidence Intelligence</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

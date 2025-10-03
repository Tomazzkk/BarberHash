import { motion } from "framer-motion";

const SplashScreen = () => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  const logoVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8 }
    },
  };

  const sloganVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.3 }
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="flex flex-col items-center space-y-4 w-full max-w-md p-8">
        <motion.h2
          className="font-oswald text-5xl font-bold uppercase tracking-wider text-foreground"
          variants={logoVariants}
        >
          Barber<span className="text-primary">#</span>
        </motion.h2>
        <motion.p 
          className="text-muted-foreground text-center"
          variants={sloganVariants}
        >
          A gestão da sua barbearia, elevada a outro nível.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
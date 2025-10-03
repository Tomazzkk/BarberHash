import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Logo = () => {
  return (
    <Link to="/" className="font-oswald text-2xl font-bold uppercase tracking-wider text-foreground">
      <motion.span whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
        Barber<span className="text-primary">#</span>
      </motion.span>
    </Link>
  );
};

export default Logo;
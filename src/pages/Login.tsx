import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSessionStore } from '@/hooks/useSessionStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignUpForm from '@/components/forms/SignUpForm';
import SignInForm from '@/components/forms/SignInForm';
import { Card } from '@/components/ui/card';
import { motion } from "framer-motion";
import Logo from '@/components/Logo';
import AnimatedPatternBackground from '@/components/AnimatedPatternBackground';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useSessionStore();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!loading && session && profile) {
      navigate(from, { replace: true });
    }
  }, [session, profile, loading, navigate, from]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-black overflow-hidden">
      <AnimatedPatternBackground />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md p-4 sm:p-8 space-y-8"
      >
        <div className="text-center text-white">
            <div className="inline-block text-5xl mb-4">
                <Logo />
            </div>
            <p className="mt-2 text-lg text-gray-300">
                A gestão da sua barbearia, elevada a outro nível.
            </p>
        </div>
        <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registrar</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="p-6 pt-8 bg-background/80 border-border/50 backdrop-blur-lg">
                        <SignInForm />
                    </Card>
                </motion.div>
            </TabsContent>
            <TabsContent value="signup">
                <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="p-6 bg-background/80 border-border/50 backdrop-blur-lg">
                        <SignUpForm />
                    </Card>
                </motion.div>
            </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Login;
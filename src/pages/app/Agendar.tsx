import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import SchedulingProgress from '@/components/scheduling/SchedulingProgress';
import Step1Services, { Service } from '@/components/scheduling/Step1Services';
import Step2DateTime, { Barber } from '@/components/scheduling/Step2DateTime';
import Step3Confirmation from '@/components/scheduling/Step3Confirmation';
import Step4Success from '@/components/scheduling/Step4Success';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionStore } from '@/hooks/useSessionStore';

const Agendar = () => {
    const [step, setStep] = useState(1);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [bookingDetails, setBookingDetails] = useState<{
        barber: Barber | null;
        date: Date | null;
        time: string | null;
    }>({
        barber: null,
        date: null,
        time: null,
    });
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedSede: sessionSede } = useSessionStore();

    const sedeId = location.state?.sedeId || sessionSede?.id;

    const handleNextFromServices = (services: Service[]) => {
        setSelectedServices(services);
        setStep(2);
    };

    const handleNextFromDateTime = (details: { barber: Barber; date: Date; time: string }) => {
        setBookingDetails(details);
        setStep(3);
    };

    const handleConfirm = (appointment: any) => {
        setConfirmedAppointment(appointment);
        setStep(4);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step => step - 1);
        } else {
            navigate(-1);
        }
    };
    
    const handleFinish = () => {
        navigate('/app/historico');
    }

    if (!sedeId) {
        return (
            <div className="text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Unidade não selecionada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Por favor, selecione uma unidade no dashboard antes de agendar.</p>
                        <Button asChild>
                            <Link to="/app/home">Voltar ao Início</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1Services onNext={handleNextFromServices} initialSelection={selectedServices} sedeId={sedeId} />;
            case 2:
                return <Step2DateTime selectedServices={selectedServices} onNext={handleNextFromDateTime} onBack={handleBack} sedeId={sedeId} />;
            case 3:
                if (!bookingDetails.barber || !bookingDetails.date || !bookingDetails.time) {
                    setStep(2); // Go back if details are missing
                    return null;
                }
                return <Step3Confirmation details={{ services: selectedServices, barber: bookingDetails.barber, date: bookingDetails.date, time: bookingDetails.time }} onConfirm={handleConfirm} onBack={handleBack} />;
            case 4:
                if (!confirmedAppointment) {
                    setStep(1); // Go back to start if confirmation details are missing
                    return null;
                }
                return <Step4Success details={confirmedAppointment} onFinish={handleFinish} />;
            default:
                return <Step1Services onNext={handleNextFromServices} sedeId={sedeId} />;
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {step < 4 && (
                <div className="mb-8">
                    <div className="flex items-center gap-4 relative">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="absolute left-0">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div className="flex-1 text-center">
                            <h1 className="text-3xl font-oswald">Serviços</h1>
                        </div>
                    </div>
                    <p className="text-center text-muted-foreground mt-2">Garanta seu desconto em combos com 2 ou mais serviços.</p>
                    <div className="mt-6">
                        <SchedulingProgress currentStep={step} totalSteps={3} />
                    </div>
                </div>
            )}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
            >
                {renderStep()}
            </motion.div>
        </div>
    );
};

export default Agendar;
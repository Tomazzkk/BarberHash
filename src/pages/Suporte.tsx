import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, Mail, BookOpen } from "lucide-react";
import { changelogData } from "@/lib/changelog";

const faqs = [
  {
    question: "Como configuro os horários de um barbeiro?",
    answer: "Vá para a página 'Barbeiros', clique no menu de opções (três pontos) do barbeiro desejado e selecione 'Gerenciar Horários'. Lá você pode definir os dias, horários de trabalho e pausas."
  },
  {
    question: "Onde eu vejo o faturamento da minha barbearia?",
    answer: "A página 'Financeiro' mostra todas as entradas e saídas. Para uma visão geral com gráficos e projeções, acesse o 'Dashboard'."
  },
  {
    question: "Como funciona o programa de fidelidade?",
    answer: "Primeiro, ative-o em 'Configurações'. Defina quantos serviços o cliente precisa completar e qual serviço será a recompensa. O sistema automaticamente contará os agendamentos concluídos para cada cliente."
  },
  {
    question: "Posso usar o sistema em mais de uma filial?",
    answer: "Sim! Na página 'Sedes', você pode cadastrar quantas unidades sua barbearia tiver. A maioria das telas (Agenda, Financeiro, etc.) pode ser filtrada por sede no menu lateral."
  }
];

const Suporte = () => {
  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Ajuda & Suporte</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
                <CardDescription>Respostas para as dúvidas mais comuns sobre o sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen /> Histórico de Versões</CardTitle>
                <CardDescription>Veja o que há de novo nas últimas atualizações do BarberPro.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {changelogData.map(log => (
                    <li key={log.version}>
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-semibold text-lg">{log.version}</h4>
                        <p className="text-sm text-muted-foreground">{log.date}</p>
                      </div>
                      <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                        {log.changes.map((change, i) => <li key={i}>{change}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LifeBuoy /> Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Se não encontrou a resposta que procurava, nossa equipe de suporte está pronta para ajudar.
                </p>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Envie um E-mail</p>
                    <a href="mailto:suporte@perhash.com" className="text-sm text-primary hover:underline">
                      suporte@perhash.com
                    </a>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nosso tempo de resposta é de até 24 horas úteis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Suporte;
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: Date;
  type: 'income' | 'expense';
  recurring: boolean;
  notifyDays: number;
}

const PaymentReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    dueDate: '',
    type: 'expense' as 'income' | 'expense',
    recurring: false,
    notifyDays: '3'
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('payment-reminders');
    if (saved) {
      setReminders(JSON.parse(saved).map((r: any) => ({
        ...r,
        dueDate: new Date(r.dueDate)
      })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('payment-reminders', JSON.stringify(reminders));
    checkNotifications();
  }, [reminders]);

  const checkNotifications = () => {
    const today = new Date();
    reminders.forEach(reminder => {
      const daysUntil = differenceInDays(reminder.dueDate, today);
      if (daysUntil === reminder.notifyDays) {
        toast({
          title: "Lembrete de Vencimento",
          description: `${reminder.title} vence em ${daysUntil} dias - R$ ${reminder.amount.toFixed(2)}`,
        });
      }
    });
  };

  const addReminder = () => {
    if (!formData.title || !formData.amount || !formData.dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: formData.title,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate),
      type: formData.type,
      recurring: formData.recurring,
      notifyDays: parseInt(formData.notifyDays)
    };

    setReminders([...reminders, newReminder]);
    setIsDialogOpen(false);
    setFormData({
      title: '',
      amount: '',
      dueDate: '',
      type: 'expense',
      recurring: false,
      notifyDays: '3'
    });

    toast({
      title: "Lembrete criado",
      description: "O lembrete foi adicionado com sucesso."
    });
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast({
      title: "Lembrete removido",
      description: "O lembrete foi excluído."
    });
  };

  const getStatusColor = (dueDate: Date) => {
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil < 0) return 'destructive';
    if (daysUntil <= 3) return 'default';
    return 'secondary';
  };

  const getStatusText = (dueDate: Date) => {
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil < 0) return 'Vencido';
    if (daysUntil === 0) return 'Vence hoje';
    if (daysUntil === 1) return 'Vence amanhã';
    return `${daysUntil} dias`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lembretes de Vencimento</h1>
          <p className="text-muted-foreground">
            Gerencie seus compromissos financeiros
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Lembrete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Descrição</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Conta de luz"
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notifyDays">Notificar com antecedência</Label>
                <Select value={formData.notifyDays} onValueChange={(value) => setFormData({...formData, notifyDays: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addReminder} className="w-full">
                Criar Lembrete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum lembrete cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          reminders
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .map(reminder => (
              <Card key={reminder.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{reminder.title}</h3>
                        <Badge variant={getStatusColor(reminder.dueDate)}>
                          {getStatusText(reminder.dueDate)}
                        </Badge>
                        {reminder.recurring && (
                          <Badge variant="outline">Recorrente</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className={reminder.type === 'income' ? 'text-income' : 'text-expense'}>
                            R$ {reminder.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(reminder.dueDate, "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};

export default PaymentReminders;

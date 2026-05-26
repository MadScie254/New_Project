import React, { useState, useEffect } from 'react';
import { useChamaStore } from '../../store/chama.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { ContributionCycle, Contribution } from '../../types';
import { formatKES, formatDate } from '../../lib/formatters';
import { exportToPDF, exportToExcel } from '../../lib/export';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Download, CreditCard, ChevronDown, Wallet } from 'lucide-react';
import PaymentModal from '../../components/payments/PaymentModal';

const ContributionsPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const { user } = useAuthStore();
  const [cycles, setCycles] = useState<ContributionCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const fetchCycles = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/chamas/${activeChama.id}/cycles`);
        setCycles(response.data);
      } catch (error) {
        console.error('Failed to fetch contribution cycles', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCycles();
  }, [activeChama]);

  const handleMakePayment = (cycle: ContributionCycle) => {
    setSelectedCycleId(cycle.id);
    setPaymentAmount(cycle.amount);
    setIsPaymentModalOpen(true);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!cycles.length) return;
    
    // Flatten data for export
    const exportData = cycles.flatMap(cycle => 
      (cycle as any).contributions.map((c: any) => ({
        Cycle: `Cycle ${cycle.cycle_number}`,
        DueDate: formatDate(cycle.due_date),
        Member: c.member.user.name,
        AmountExpected: cycle.amount,
        AmountPaid: c.amount_paid,
        Status: c.status,
        PaidOn: c.paid_at ? formatDate(c.paid_at) : 'N/A'
      }))
    );

    if (type === 'pdf') {
      exportToPDF(
        exportData, 
        `${activeChama?.name} - Contributions`, 
        'contributions_report',
        [
          { header: 'Cycle', dataKey: 'Cycle' },
          { header: 'Member', dataKey: 'Member' },
          { header: 'Status', dataKey: 'Status' },
          { header: 'Amount Paid', dataKey: 'AmountPaid' },
          { header: 'Paid On', dataKey: 'PaidOn' },
        ]
      );
    } else {
      exportToExcel(exportData, 'contributions_report');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>;
      case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'LATE': return <Badge variant="destructive">Late</Badge>;
      case 'WAIVED': return <Badge variant="secondary">Waived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!activeChama) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contributions</h1>
          <p className="text-muted-foreground">Manage and track member contributions.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          {cycles.length > 0 && cycles[0].status === 'OPEN' && (
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleMakePayment(cycles[0])}>
              <CreditCard className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            <Card className="h-64 animate-pulse bg-muted/50 border-none" />
          </div>
        ) : cycles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Contributions Yet</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Contribution cycles haven't been generated for this chama yet. The Treasurer will set this up.
              </p>
            </CardContent>
          </Card>
        ) : (
          cycles.map((cycle) => {
            const contributions = (cycle as any).contributions as Contribution[];
            const myContribution = contributions.find(c => c.member?.user?.name === user?.name);
            const totalCollected = contributions.reduce((sum, c) => sum + Number(c.amount_paid), 0);
            const progressPercentage = contributions.length > 0 
              ? Math.round((totalCollected / (contributions.length * cycle.amount)) * 100)
              : 0;

            return (
              <Card key={cycle.id} className="overflow-hidden">
                <div className={`h-1 w-full ${cycle.status === 'OPEN' ? 'bg-primary' : cycle.status === 'CLOSED' ? 'bg-muted' : 'bg-accent'}`} />
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg font-semibold">Cycle {cycle.cycle_number}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(cycle.due_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expected per member: <span className="font-medium text-foreground">{formatKES(cycle.amount)}</span>
                      </p>
                    </div>
                    
                    {myContribution && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">My Status</p>
                        {getStatusBadge(myContribution.status)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="hidden sm:table-cell">Paid On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions.slice(0, 5).map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold hidden sm:flex">
                                  {getInitials(c.member?.user?.name || '')}
                                </div>
                                {c.member?.user?.name}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(c.status)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {c.status === 'PAID' ? formatKES(c.amount_paid) : '-'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {c.paid_at ? formatDate(c.paid_at) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {contributions.length > 5 && (
                    <div className="p-3 text-center border-t border-border">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        View All {contributions.length} Members <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {isPaymentModalOpen && activeChama && user && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={paymentAmount}
          paymentType="CONTRIBUTION"
          referenceId={selectedCycleId}
          chamaId={activeChama.id}
          defaultPhone={user.phone}
          onSuccess={() => {
            fetchCycles();
          }}
        />
      )}
    </div>
  );
};

export default ContributionsPage;

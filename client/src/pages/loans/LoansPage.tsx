import React, { useState, useEffect } from 'react';
import { useChamaStore } from '../../store/chama.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { Loan } from '../../types';
import { formatKES, formatDate } from '../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, PlusCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import PaymentModal from '../../components/payments/PaymentModal';

const LoansPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const { user } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const fetchLoans = async () => {
    if (!activeChama) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/chamas/${activeChama.id}/loans`);
      setLoans(response.data);
    } catch (error) {
      console.error('Failed to fetch loans', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [activeChama]);

  const handleMakeRepayment = (loan: Loan) => {
    if (!loan.repayments || loan.repayments.length === 0) return;
    
    // Find next pending repayment
    const nextRepayment = loan.repayments.find(r => r.status === 'PENDING' || r.status === 'OVERDUE');
    if (nextRepayment) {
      setSelectedLoanId(nextRepayment.id);
      setPaymentAmount(nextRepayment.amount);
      setIsPaymentModalOpen(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'APPROVED': return <Badge className="bg-blue-500 hover:bg-blue-600">Approved</Badge>;
      case 'DISBURSED': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>;
      case 'REPAID': return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Repaid</Badge>;
      case 'DEFAULTED': return <Badge variant="destructive">Defaulted</Badge>;
      case 'REJECTED': return <Badge variant="destructive" className="bg-red-800 hover:bg-red-900"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!activeChama) return null;

  const myLoans = loans.filter(
    (l) => l.applicant?.user?.id === user?.id || l.applicant?.user?.phone === user?.phone
  );
  const activeLoan = myLoans.find(l => ['PENDING', 'APPROVED', 'DISBURSED'].includes(l.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Loans</h1>
          <p className="text-muted-foreground">Apply for and manage chama loans.</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" disabled={!!activeLoan}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply for Loan
        </Button>
      </div>

      <Tabs defaultValue="my-loans" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="my-loans">My Loans</TabsTrigger>
          <TabsTrigger value="all-loans">All Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="my-loans" className="space-y-6">
          {isLoading ? (
             <Card className="h-48 animate-pulse bg-muted/50 border-none" />
          ) : myLoans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No Loan History</h3>
                <p className="text-muted-foreground max-w-sm mt-1">
                  You haven't applied for any loans yet. You can borrow up to 3x your total contributions.
                </p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  Check Eligibility
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myLoans.map(loan => (
                <Card key={loan.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    loan.status === 'DISBURSED' ? 'bg-emerald-500' : 
                    loan.status === 'PENDING' ? 'bg-yellow-500' : 
                    loan.status === 'REPAID' ? 'bg-muted-foreground' : 'bg-primary'
                  }`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{formatKES(loan.amount)}</CardTitle>
                      {getStatusBadge(loan.status)}
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">{loan.purpose}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 border-t border-border mt-2 bg-muted/10">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">Applied On</p>
                        <p className="font-medium">{formatDate(loan.applied_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">Term</p>
                        <p className="font-medium">{loan.repayment_months} months</p>
                      </div>
                      <div className="col-span-2 mt-2 flex gap-2">
                        <Button variant="outline" className="flex-1 text-xs h-8">
                          View Details
                        </Button>
                        {loan.status === 'DISBURSED' && loan.repayments?.some(r => r.status !== 'PAID') && (
                          <Button 
                            className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90"
                            onClick={() => handleMakeRepayment(loan)}
                          >
                            Make Repayment
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-loans">
          {/* Admin/All loans view could go here */}
           <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-muted-foreground">Only Treasurer and Secretary can view all loans in detail.</p>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {isPaymentModalOpen && activeChama && user && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={paymentAmount}
          paymentType="LOAN_REPAYMENT"
          referenceId={selectedLoanId}
          chamaId={activeChama.id}
          defaultPhone={user.phone}
          onSuccess={() => {
            fetchLoans();
          }}
        />
      )}
    </div>
  );
};

export default LoansPage;

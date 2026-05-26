import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { formatKES } from '../../lib/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  paymentType: 'CONTRIBUTION' | 'LOAN_REPAYMENT';
  referenceId: string; // cycle_id or loan_id
  chamaId: string;
  defaultPhone: string;
  onSuccess?: () => void;
}

type PaymentStep = 'DETAILS' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  paymentType,
  referenceId,
  chamaId,
  defaultPhone,
  onSuccess
}) => {
  const [step, setStep] = useState<PaymentStep>('DETAILS');
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+/, ''));
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setPhone(defaultPhone.replace(/^\+/, ''));
      setCheckoutRequestId(null);
      setErrorMsg('');
    }
  }, [isOpen, defaultPhone]);

  // Polling for status when in processing step
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (step === 'PROCESSING' && checkoutRequestId) {
      pollInterval = setInterval(async () => {
        try {
          // Check backend for transaction status
          // Note: In real app, we might check our DB mpesa_transactions table
          // This requires a new endpoint to check status by checkout_request_id
          const response = await api.get(`/mpesa/status/${checkoutRequestId}`);
          
          if (response.data.status === 'SUCCESS') {
            setStep('SUCCESS');
            clearInterval(pollInterval);
            if (onSuccess) onSuccess();
          } else if (response.data.status === 'FAILED') {
            setErrorMsg(response.data.resultDesc || 'Payment failed or was cancelled.');
            setStep('ERROR');
            clearInterval(pollInterval);
          }
        } catch (error) {
          // Just keep polling if error is 404 (not callback received yet)
          // or fail after timeout
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 2 minutes (Mpesa timeout)
      timeoutId = setTimeout(() => {
        if (step === 'PROCESSING') {
          clearInterval(pollInterval);
          setErrorMsg('Request timed out. Please check your phone or try again.');
          setStep('ERROR');
        }
      }, 120000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [step, checkoutRequestId, onSuccess]);

  const handlePay = async () => {
    setStep('PROCESSING');
    setErrorMsg('');
    
    try {
      const payload: any = {
        phone: phone.startsWith('254') ? phone : phone.startsWith('0') ? `254${phone.substring(1)}` : `254${phone}`,
        amount,
        accountRef: `Chama ${chamaId.substring(0, 8)}`,
      };

      if (paymentType === 'CONTRIBUTION') {
        payload.contributionId = referenceId;
      } else {
        payload.repaymentId = referenceId;
      }

      const response = await api.post('/mpesa/stkpush', payload);

      setCheckoutRequestId(response.data.checkoutRequestId);
    } catch (error: any) {
      console.error('STK Push Error:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to initiate payment.');
      setStep('ERROR');
    }
  };

  // Development simulation bypass
  const handleSimulateSuccess = () => {
    setStep('SUCCESS');
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </div>
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            {paymentType === 'CONTRIBUTION' ? 'Monthly Contribution' : 'Loan Repayment'}
          </DialogDescription>
        </DialogHeader>

        {step === 'DETAILS' && (
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center border border-border">
              <span className="text-muted-foreground font-medium">Amount to Pay</span>
              <span className="text-2xl font-bold text-foreground">{formatKES(amount)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input 
                id="phone" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="2547XXXXXXXX"
                className="text-lg tracking-wider font-medium h-12"
              />
              <p className="text-xs text-muted-foreground">
                A prompt will be sent to this number to enter your M-Pesa PIN.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="button" onClick={handlePay} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                Pay {formatKES(amount)}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-emerald-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Check your phone</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We've sent an M-Pesa prompt to <strong>+{phone}</strong>. Please enter your PIN to confirm the payment.
              </p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-4">
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Waiting for confirmation...
            </div>

            {/* Dev bypass for sandbox */}
            {process.env.NODE_ENV === 'development' && (
              <Button variant="ghost" size="sm" onClick={handleSimulateSuccess} className="mt-8 text-xs text-muted-foreground hover:text-emerald-600">
                (Dev) Simulate Success
              </Button>
            )}
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-600">Payment Successful!</h3>
            <p className="text-center text-muted-foreground text-sm">
              Your payment of {formatKES(amount)} has been received and your record updated.
            </p>
            <Button onClick={onClose} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          </div>
        )}

        {step === 'ERROR' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive">Payment Failed</h3>
            <p className="text-center text-muted-foreground text-sm max-w-xs">
              {errorMsg}
            </p>
            <div className="flex gap-3 w-full mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('DETAILS')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

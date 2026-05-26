import React, { useState, useEffect } from 'react';
import { useChamaStore } from '../../store/chama.store';
import api from '../../lib/api';
import { Investment } from '../../types';
import { formatKES, formatDate } from '../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Briefcase, TrendingUp, PieChart, Plus } from 'lucide-react';

const InvestmentsPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      try {
        const [invRes, portRes] = await Promise.all([
          api.get(`/chamas/${activeChama.id}/investments`),
          api.get(`/chamas/${activeChama.id}/investments/portfolio`)
        ]);
        setInvestments(invRes.data);
        setPortfolio(portRes.data);
      } catch (error) {
        console.error('Failed to fetch investments', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [activeChama]);

  if (!activeChama) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Investments</h1>
          <p className="text-muted-foreground">Track external chama investments.</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Log Investment
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 animate-pulse">
           <Card className="h-32 bg-muted/50 border-none col-span-3" />
           <Card className="h-64 bg-muted/50 border-none col-span-1" />
           <Card className="h-64 bg-muted/50 border-none col-span-2" />
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          {portfolio && (
            <Card className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-none shadow-lg">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      <Briefcase className="w-5 h-5" />
                      <h3 className="font-medium">Total Invested</h3>
                    </div>
                    <p className="text-3xl font-bold">{formatKES(portfolio.total_invested)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      <TrendingUp className="w-5 h-5" />
                      <h3 className="font-medium">Avg. Expected ROI</h3>
                    </div>
                    <p className="text-3xl font-bold">{portfolio.average_roi}% p.a.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      <PieChart className="w-5 h-5" />
                      <h3 className="font-medium">Active Assets</h3>
                    </div>
                    <p className="text-3xl font-bold">{portfolio.active_count} <span className="text-lg font-normal opacity-80">investments</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment List */}
          <h2 className="text-lg font-semibold mt-8 mb-4">Investment Portfolio</h2>
          
          {investments.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No investments logged yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {investments.map(inv => (
                <Card key={inv.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{inv.name}</CardTitle>
                        <CardDescription>{inv.institution}</CardDescription>
                      </div>
                      <Badge variant={inv.status === 'ACTIVE' ? 'default' : 'secondary'} className={inv.status === 'ACTIVE' ? 'bg-primary' : ''}>
                        {inv.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount Invested</p>
                        <p className="font-semibold text-lg">{formatKES(inv.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected ROI</p>
                        <p className="font-semibold text-lg text-emerald-600">+{inv.roi_expected}%</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Maturity Date</p>
                        <p className="font-medium">{inv.maturity_date ? formatDate(inv.maturity_date) : 'Open-ended'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentsPage;

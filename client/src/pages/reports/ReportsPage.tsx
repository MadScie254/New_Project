import React, { useEffect, useMemo, useState } from 'react';
import { useChamaStore } from '../../store/chama.store';
import api from '../../lib/api';
import { exportToCSV, exportToExcel, exportToPDF } from '../../lib/export';
import { formatKES } from '../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, PieChart, BarChart3, ShieldAlert } from 'lucide-react';

interface MonthlyReport {
  period: { year: number; month: number };
  income: {
    contributions: number;
    contribution_count: number;
    loan_repayments: number;
    repayment_count: number;
    fines: number;
    fine_count: number;
    total: number;
  };
  disbursements: {
    loans: number;
    loan_count: number;
    total: number;
  };
  net: number;
}

interface AnnualSummary {
  year: number;
  total_contributions: number;
  contribution_transactions: number;
  total_loans_disbursed: number;
  loans_count: number;
  meetings_held: number;
}

interface ComplianceRow {
  member_id: string;
  name: string;
  phone: string;
  role: string;
  total_cycles: number;
  paid_count: number;
  late_count: number;
  pending_count: number;
  compliance_rate: number;
  total_contributed: number;
}

interface DefaultersReport {
  late_contributions: any[];
  overdue_loans: any[];
  unpaid_fines: any[];
  summary: {
    late_contribution_count: number;
    overdue_loan_count: number;
    unpaid_fine_count: number;
  };
}

const ReportsPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [annual, setAnnual] = useState<AnnualSummary | null>(null);
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [defaulters, setDefaulters] = useState<DefaultersReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      setError(null);

      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const [monthlyRes, annualRes, complianceRes, defaultersRes] = await Promise.all([
          api.get(`/chamas/${activeChama.id}/reports/monthly`, { params: { year, month } }),
          api.get(`/chamas/${activeChama.id}/reports/annual`, { params: { year } }),
          api.get(`/chamas/${activeChama.id}/reports/compliance`),
          api.get(`/chamas/${activeChama.id}/reports/defaulters`),
        ]);

        setMonthly(monthlyRes.data);
        setAnnual(annualRes.data);
        setCompliance(complianceRes.data);
        setDefaulters(defaultersRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load reports.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [activeChama]);

  const incomeBreakdown = useMemo(() => {
    if (!monthly) return [];
    return [
      { label: 'Contributions', value: monthly.income.contributions },
      { label: 'Repayments', value: monthly.income.loan_repayments },
      { label: 'Fines', value: monthly.income.fines },
    ];
  }, [monthly]);

  const exportCompliance = (type: 'pdf' | 'excel' | 'csv') => {
    if (!compliance.length) return;
    const exportData = compliance.map((row) => ({
      Member: row.name,
      Phone: row.phone,
      Role: row.role,
      TotalCycles: row.total_cycles,
      Paid: row.paid_count,
      Late: row.late_count,
      Pending: row.pending_count,
      ComplianceRate: `${row.compliance_rate}%`,
      TotalContributed: row.total_contributed,
    }));

    if (type === 'pdf') {
      exportToPDF(exportData, `${activeChama?.name} - Compliance`, 'compliance_report', [
        { header: 'Member', dataKey: 'Member' },
        { header: 'Role', dataKey: 'Role' },
        { header: 'Paid', dataKey: 'Paid' },
        { header: 'Late', dataKey: 'Late' },
        { header: 'Pending', dataKey: 'Pending' },
        { header: 'Compliance', dataKey: 'ComplianceRate' },
      ]);
    } else if (type === 'excel') {
      exportToExcel(exportData, 'compliance_report');
    } else {
      exportToCSV(exportData, 'compliance_report');
    }
  };

  if (!activeChama) return null;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
        <Card className="h-32 bg-muted/50 border-none" />
        <Card className="h-32 bg-muted/50 border-none" />
        <Card className="h-32 bg-muted/50 border-none" />
        <Card className="h-72 bg-muted/50 border-none md:col-span-2" />
        <Card className="h-72 bg-muted/50 border-none" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-muted-foreground">Financial statements, compliance, and defaulters overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatKES(monthly?.income.total || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Net: {formatKES(monthly?.net || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Disbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatKES(monthly?.disbursements.total || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Loans: {monthly?.disbursements.loan_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Annual Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatKES(annual?.total_contributions || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions: {annual?.contribution_transactions || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Monthly Income Breakdown
            </CardTitle>
            <CardDescription>Distribution of income sources for this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incomeBreakdown.map((item) => {
                const percentage = monthly?.income.total
                  ? Math.round((item.value / monthly.income.total) * 100)
                  : 0;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{formatKES(item.value)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5" />
              Compliance Summary
            </CardTitle>
            <CardDescription>Top member compliance snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
            {compliance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No compliance data.</p>
            ) : (
              <div className="space-y-4">
                {compliance.slice(0, 5).map((row) => (
                  <div key={row.member_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.role}</p>
                    </div>
                    <Badge variant={row.compliance_rate >= 80 ? 'default' : 'secondary'}>
                      {row.compliance_rate}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCompliance('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportCompliance('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportCompliance('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5" />
            Defaulters Overview
          </CardTitle>
          <CardDescription>Members with pending contributions, loans, or fines.</CardDescription>
        </CardHeader>
        <CardContent>
          {defaulters ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Late Contributions</p>
                <p className="text-2xl font-semibold text-foreground">
                  {defaulters.summary.late_contribution_count}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Overdue Loans</p>
                <p className="text-2xl font-semibold text-foreground">
                  {defaulters.summary.overdue_loan_count}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Unpaid Fines</p>
                <p className="text-2xl font-semibold text-foreground">
                  {defaulters.summary.unpaid_fine_count}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No defaulter data.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Annual Snapshot
          </CardTitle>
          <CardDescription>High-level summary for the current year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">Loans Disbursed</p>
              <p className="text-2xl font-semibold text-foreground">{formatKES(annual?.total_loans_disbursed || 0)}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">Loans Count</p>
              <p className="text-2xl font-semibold text-foreground">{annual?.loans_count || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">Meetings Held</p>
              <p className="text-2xl font-semibold text-foreground">{annual?.meetings_held || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useChamaStore } from '../../store/chama.store';
import { DashboardData } from '../../types';
import api from '../../lib/api';
import { formatKES, formatDate, getInitials } from '../../lib/formatters';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/chamas/${activeChama.id}/dashboard`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [activeChama]);

  if (!activeChama) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Active Chama</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          You don't have an active chama selected. Please select one from the sidebar or create a new one.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-muted/50 h-32 border-none" />
        ))}
        <Card className="col-span-full md:col-span-2 lg:col-span-3 h-96 bg-muted/50 border-none" />
        <Card className="col-span-full md:col-span-1 h-96 bg-muted/50 border-none" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeChama.name}</h1>
        <p className="text-muted-foreground">Dashboard overview and recent activities.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pool Balance
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatKES(data.wallet.balance)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
              <span>+KES {data.monthly_collection.collected.toLocaleString()} this month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Loans
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.active_loans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding: {formatKES(data.outstanding_loan_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.member_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Max capacity: {activeChama.max_members}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Meeting
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            {data.next_meeting ? (
              <>
                <div className="text-lg font-bold text-foreground truncate">
                  {formatDate(data.next_meeting.scheduled_at, true)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {data.next_meeting.location || 'Online / TBD'}
                </p>
              </>
            ) : (
              <div className="text-lg font-bold text-foreground">Not Scheduled</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Collection Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">This Month's Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-8 mt-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatKES(data.monthly_collection.collected)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    of {formatKES(data.monthly_collection.expected)} expected
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{data.monthly_collection.percentage}%</span>
                </div>
              </div>
              <Progress value={data.monthly_collection.percentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={data.monthly_collection.percentage === 100 ? "default" : "secondary"}>
                  {data.monthly_collection.percentage === 100 ? 'Target Reached' : 'Collecting'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Frequency</p>
                <span className="font-medium capitalize text-foreground">{activeChama.frequency}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent_activity.length > 0 ? (
                data.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-snug text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useChamaStore } from '../../store/chama.store';
import api from '../../lib/api';
import { Meeting } from '../../types';
import { formatDate } from '../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Users, FileText, ChevronRight } from 'lucide-react';

const MeetingsPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/chamas/${activeChama.id}/meetings`);
        setMeetings(response.data);
      } catch (error) {
        console.error('Failed to fetch meetings', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [activeChama]);

  if (!activeChama) return null;

  const upcomingMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meetings</h1>
          <p className="text-muted-foreground">Schedule and review chama meetings.</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {isLoading ? (
        <Card className="h-48 animate-pulse bg-muted/50 border-none" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Meeting */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Upcoming Meetings
            </h2>
            
            {upcomingMeetings.length === 0 ? (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No upcoming meetings scheduled.
                </CardContent>
              </Card>
            ) : (
              upcomingMeetings.map(meeting => {
                let agendaItems = [];
                try {
                  agendaItems = JSON.parse(meeting.agenda || '[]');
                } catch(e) {}

                return (
                  <Card key={meeting.id} className="border-primary/20 shadow-md">
                    <div className="h-2 w-full bg-primary" />
                    <CardHeader>
                      <CardTitle>{formatDate(meeting.scheduled_at, true)}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 text-foreground/80">
                        <MapPin className="w-4 h-4" /> {meeting.location || 'TBA'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {agendaItems.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Agenda</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {agendaItems.map((item: any, i: number) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-primary font-bold">•</span>
                                  <span>{item.item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button className="w-full" variant="outline">
                          View Details & RSVP
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Past Meetings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Past Meetings & Minutes
            </h2>
            
            <div className="space-y-3">
              {pastMeetings.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No past meetings recorded.
                  </CardContent>
                </Card>
              ) : (
                pastMeetings.map(meeting => (
                  <Card key={meeting.id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{formatDate(meeting.scheduled_at)}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(meeting as any)._count?.attendance || 0} Attended</span>
                          {meeting.minutes && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Minutes saved</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;

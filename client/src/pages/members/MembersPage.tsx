import React, { useState, useEffect } from 'react';
import { useChamaStore } from '../../store/chama.store';
import api from '../../lib/api';
import { ChamaMember } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, MoreVertical, Shield } from 'lucide-react';
import { getInitials } from '../../lib/formatters';

const MembersPage: React.FC = () => {
  const { activeChama } = useChamaStore();
  const [members, setMembers] = useState<ChamaMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeChama) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/chamas/${activeChama.id}`);
        // Extract members from chama details response
        setMembers(response.data.members || []);
      } catch (error) {
        console.error('Failed to fetch members', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [activeChama]);

  if (!activeChama) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Members</h1>
          <p className="text-muted-foreground">{members.length} / {activeChama.max_members} members</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <Card key={i} className="h-24 bg-muted/50 border-none" />
           ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Card key={member.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={member.user?.photo_url} alt={member.user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(member.user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {member.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {member.user?.phone}
                  </p>
                  <div className="flex items-center gap-2">
                    {member.role !== 'MEMBER' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-primary text-primary flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {member.role}
                      </Badge>
                    )}
                    {!member.is_active && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;

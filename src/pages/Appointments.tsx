import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar, User, Loader2, Clock } from 'lucide-react';
import { Appointment } from '@/types';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    doctor_name: '',
    appointment_date: '',
  });

  const fetchAppointments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive',
      });
    } else {
      setAppointments((data as Appointment[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.doctor_name.trim() || formData.doctor_name.length > 100) {
      toast({
        title: 'Invalid Doctor Name',
        description: 'Doctor name is required and must be under 100 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.appointment_date) {
      toast({
        title: 'Invalid Date',
        description: 'Please select an appointment date.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      doctor_name: formData.doctor_name.trim(),
      appointment_date: formData.appointment_date,
    });

    setIsAdding(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add appointment.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Appointment added successfully.',
      });
      setFormData({ doctor_name: '', appointment_date: '' });
      setShowForm(false);
      fetchAppointments();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete appointment.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Appointment removed successfully.',
      });
      setAppointments(appointments.filter((a) => a.id !== id));
    }
  };

  const isPast = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };

  const isToday = (date: string) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return today.toDateString() === appointmentDate.toDateString();
  };

  const isUpcoming = (date: string) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const diffDays = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const upcomingAppointments = appointments.filter((a) => !isPast(a.appointment_date));
  const pastAppointments = appointments.filter((a) => isPast(a.appointment_date));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="text-sm text-muted-foreground">Manage your doctor visits</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Appointment
          </Button>
        </div>

        {/* Add Appointment Form */}
        {showForm && (
          <Card className="mb-6 border-border shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Schedule Appointment</CardTitle>
              <CardDescription>Enter the appointment details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor Name</Label>
                  <Input
                    id="doctor"
                    placeholder="e.g., Dr. Smith"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Schedule Appointment
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="flex flex-col items-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No appointments yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Schedule your first appointment to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Upcoming</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingAppointments.map((appointment) => (
                    <Card 
                      key={appointment.id} 
                      className={`border-border shadow-card transition-all hover:shadow-healthcare animate-fade-in ${
                        isToday(appointment.appointment_date) ? 'border-success/50 bg-success/5' :
                        isUpcoming(appointment.appointment_date) ? 'border-primary/50' : ''
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-foreground">{appointment.doctor_name}</h3>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {isToday(appointment.appointment_date) && (
                                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                                  <Clock className="h-3 w-3" />
                                  Today
                                </span>
                              )}
                              {isUpcoming(appointment.appointment_date) && !isToday(appointment.appointment_date) && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                  This Week
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(appointment.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Past</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pastAppointments.map((appointment) => (
                    <Card 
                      key={appointment.id} 
                      className="border-border/50 bg-muted/30 shadow-card animate-fade-in"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <h3 className="font-semibold text-muted-foreground">{appointment.doctor_name}</h3>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(appointment.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Appointments;

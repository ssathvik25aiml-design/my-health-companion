import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pill, AlertCircle, Loader2 } from 'lucide-react';
import { Medicine } from '@/types';

const Medicines: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    strength: '',
    expiry_date: '',
  });

  const fetchMedicines = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load medicines.',
        variant: 'destructive',
      });
    } else {
      setMedicines((data as Medicine[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim() || formData.name.length > 100) {
      toast({
        title: 'Invalid Name',
        description: 'Medicine name is required and must be under 100 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.strength.trim() || formData.strength.length > 50) {
      toast({
        title: 'Invalid Strength',
        description: 'Strength is required and must be under 50 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.expiry_date) {
      toast({
        title: 'Invalid Date',
        description: 'Please select an expiry date.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from('medicines').insert({
      user_id: user.id,
      name: formData.name.trim(),
      strength: formData.strength.trim(),
      expiry_date: formData.expiry_date,
    });

    setIsAdding(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add medicine.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Medicine added successfully.',
      });
      setFormData({ name: '', strength: '', expiry_date: '' });
      setShowForm(false);
      fetchMedicines();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('medicines').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete medicine.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Medicine removed successfully.',
      });
      setMedicines(medicines.filter((m) => m.id !== id));
    }
  };

  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medicines</h1>
            <p className="text-sm text-muted-foreground">Manage your medications</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Medicine
          </Button>
        </div>

        {/* Add Medicine Form */}
        {showForm && (
          <Card className="mb-6 border-border shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Add New Medicine</CardTitle>
              <CardDescription>Enter the medicine details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Paracetamol"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength</Label>
                  <Input
                    id="strength"
                    placeholder="e.g., 500mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 sm:col-span-3">
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Medicine
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Medicines List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : medicines.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="flex flex-col items-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No medicines yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first medicine to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map((medicine) => (
              <Card 
                key={medicine.id} 
                className={`border-border shadow-card transition-all hover:shadow-healthcare animate-fade-in ${
                  isExpired(medicine.expiry_date) ? 'border-destructive/50' : 
                  isExpiringSoon(medicine.expiry_date) ? 'border-warning/50' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{medicine.name}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Strength: {medicine.strength}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-sm ${
                          isExpired(medicine.expiry_date) ? 'text-destructive' :
                          isExpiringSoon(medicine.expiry_date) ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          Expires: {formatDate(medicine.expiry_date)}
                        </span>
                        {isExpired(medicine.expiry_date) && (
                          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </span>
                        )}
                        {isExpiringSoon(medicine.expiry_date) && !isExpired(medicine.expiry_date) && (
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(medicine.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Medicines;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Calendar, FileText, ArrowRight, User, Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Medicines',
      description: 'Track your medications, dosages, and expiry dates',
      icon: Pill,
      path: '/medicines',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Appointments',
      description: 'Manage your doctor appointments and schedules',
      icon: Calendar,
      path: '/appointments',
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Prescriptions',
      description: 'Store and access your prescriptions digitally',
      icon: FileText,
      path: '/prescriptions',
      color: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome to CareCrew
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your health information in one secure place
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8 border-border shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <User className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Logged in as</p>
              <p className="text-sm text-muted-foreground">{user?.phone}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-success">Secure</span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon, path, color }, index) => (
            <Card 
              key={title} 
              className="group border-border shadow-card transition-all hover:shadow-healthcare animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={path}>
                  <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                    Go to {title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg bg-accent/50 p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-semibold text-foreground">Your Data is Secure</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            All your health information is stored securely and is only accessible by you. 
            Your data is never shared with third parties.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

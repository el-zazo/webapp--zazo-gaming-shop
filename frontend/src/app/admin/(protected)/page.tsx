
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
      <Card>
          <CardHeader>
              <CardTitle>Welcome, {user?.username}!</CardTitle>
              <CardDescription>This is your admin control panel. From here, you can manage the content of your website.</CardDescription>
          </CardHeader>
          <CardContent>
              <p>Select an option from the menu to start managing your products, categories, or guides.</p>
          </CardContent>
      </Card>
    </>
  );
};

export default AdminDashboard;

'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateOrganizationDialog from './Create-organization-dialog';
import { Organization } from '@/types/organization.types';

interface StatsRowProps {
  organizations: Organization[];
}

const StatsRow: React.FC<StatsRowProps> = ({ organizations }) => {
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  return (
    <>
      {/* Header with Create Organization button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold animate-fade-in">
            Organizations
          </h1>
          <p className="text-muted-foreground animate-fade-in">
            Manage and collaborate with your teams
          </p>
        </div>
        <div className="flex gap-2 animate-fade-in">
          <Button onClick={() => setCreateOrgOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Organizations</p>
          <p className="text-2xl font-semibold">{organizations.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-2xl font-semibold">
            {organizations.reduce((sum, org) => sum + org.members, 0)}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Sheets</p>
          <p className="text-2xl font-semibold">
            {organizations.reduce((sum, org) => sum + org.sheets, 0)}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Admin Access</p>
          <p className="text-2xl font-semibold">
            {organizations.filter((org) => org.role === "Admin").length}
          </p>
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    </>
  );
};

export default StatsRow;
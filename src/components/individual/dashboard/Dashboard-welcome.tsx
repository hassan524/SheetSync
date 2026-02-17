"use client";
import React from "react";
// import { Button } from '@/components/ui/button';
// import NewSheetModal from '@/components/sheets/New-sheet-modal';
// import { Plus } from 'lucide-react';

const DashboardWelcome = () => {
  const [NewSheetOpen, setNewSheetOpen] = React.useState(false);

  return (
    <section className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, John</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your spreadsheets today
          </p>
        </div>
        {/* <Button onClick={() => setNewSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Sheet
                </Button> */}
      </div>

      {/* <NewSheetModal open={NewSheetOpen} onOpenChange={setNewSheetOpen} />  */}
    </section>
  );
};

export default DashboardWelcome;

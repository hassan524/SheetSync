"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { Badge }       from "@/components/ui/badge";
import { Button }      from "@/components/ui/button";
import NewSheetModal   from "@/components/sheets/New-sheet-modal";
import InviteTeamModal from "@/components/modals/Invite-team-modal";
import { Building2, ArrowLeft, Plus, UserPlus, Settings, Shield, Zap } from "lucide-react";
import { OrgDetail } from "@/app/organizations/[id]/page";

export function OrgHeader({ org }: { org: OrgDetail }) {
  const router = useRouter();
  const [newSheet, setNewSheet] = useState(false);
  const [invite,   setInvite]   = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/organizations")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Organizations
        </button>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setInvite(true)} className="h-8 gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </Button>
          <Button size="sm" onClick={() => setNewSheet(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> New sheet
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold">{org.name}</h1>
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] gap-1">
              <Shield className="h-2.5 w-2.5" />{org.role}
            </Badge>
            {org.plan && (
              <Badge variant="outline" className="h-5 px-1.5 text-[11px] gap-1">
                <Zap className="h-2.5 w-2.5 text-yellow-500" />{org.plan}
              </Badge>
            )}
          </div>
          {org.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{org.description}</p>
          )}
        </div>
      </div>

      {/* <NewSheetModal   open={newSheet} onOpenChange={setNewSheet} />
      <InviteTeamModal open={invite}   onOpenChange={setInvite}   /> */}
    </>
  );
}
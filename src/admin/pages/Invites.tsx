import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminInvites() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invite Codes</h1>
          <p className="text-muted-foreground">Manage invitation codes and access control</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invite Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Codes</CardTitle>
          <CardDescription>Active and expired invitation codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Invite code management interface will be displayed here. Features will include:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Code generation and management</li>
              <li>Usage tracking (uses vs. max uses)</li>
              <li>Expiration dates</li>
              <li>Tagging (beta, partner, internal)</li>
              <li>User redemption history</li>
              <li>Enable/disable codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

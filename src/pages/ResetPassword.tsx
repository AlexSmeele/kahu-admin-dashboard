import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Password reset email sent! Check your inbox.");
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-muted-foreground">
            {sent
              ? "Check your email for a reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="mt-8 space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              A password reset link has been sent to <strong>{email}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Send another link
            </Button>
          </div>
        )}

        <div className="text-center space-y-2">
          <Link to="/login" className="block text-sm text-primary hover:underline">
            Back to login
          </Link>
          <Link to="/" className="block text-sm text-muted-foreground hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { toast } from "@/hooks/use-toast";

const ToastPreview: React.FC = () => {
  const showDefault = () => {
    toast({ title: "Hello", description: "This is a theme-matching toast (default)." });
  };

  const showDestructive = () => {
    toast({ title: "Error", description: "Something went wrong.", variant: 'destructive' as any });
  };

  const showStack = () => {
    for (let i = 1; i <= 4; i++) {
      toast({ title: `Item ${i}`, description: `Stacked toast ${i}` });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="p-6 rounded-md bg-card shadow-md">
        <h2 className="text-lg font-semibold mb-4">Toast preview</h2>
        <div className="flex gap-3">
          <button onClick={showDefault} className="btn btn-primary">Show default</button>
          <button onClick={showDestructive} className="btn btn-destructive">Show destructive</button>
          <button onClick={showStack} className="btn">Show multiple</button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Open the page and click the buttons to preview toasts at the bottom-right.</p>
      </div>
    </div>
  );
};

export default ToastPreview;

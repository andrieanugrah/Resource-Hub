"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LifeBuoy, Mail, MessageSquare } from "lucide-react";

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" description="Get help with ResourceHub" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@resourcehub.com</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">For technical issues, bug reports, or feature requests, email our support team. We typically respond within 24 hours.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Available Mon-Fri, 9am-5pm</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Chat with our support team in real-time for quick answers to your questions.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-8 text-center">
          <LifeBuoy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Need more help?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Check our documentation or browse frequently asked questions in the knowledge base.</p>
        </CardContent>
      </Card>
    </div>
  );
}


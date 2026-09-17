import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Check, Plus, Star, ChevronDown, Settings2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type Policy = 'reject' | 'quarantine' | 'none';
type Alignment = 's' | 'r';
type Pct = '100' | '50' | '25';

export function AddDomainDialog() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  
  // Policy settings - defaults to balanced settings for new users
  const [policy, setPolicy] = useState<Policy>('quarantine');
  const [subdomainPolicy, setSubdomainPolicy] = useState<Policy>('quarantine');
  const [dkimAlignment, setDkimAlignment] = useState<Alignment>('r');
  const [spfAlignment, setSpfAlignment] = useState<Alignment>('r');
  const [pct, setPct] = useState<Pct>('100');
  
  const reportingUri = user?.sharedAggregatePostboxAddress ?? 'your-address@reports.example.com';
  
  const generatedRecord = `v=DMARC1; p=${policy}; sp=${subdomainPolicy}; rua=mailto:${reportingUri}; adkim=${dkimAlignment}; aspf=${spfAlignment}; pct=${pct}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Step 1: Access your DNS settings</h3>
        <p className="text-sm text-muted-foreground">
          Log in to your domain registrar or DNS provider and navigate to the DNS management section for your domain.
        </p>
      </div>

      {/* Step 2 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Step 2: Create a DMARC TXT record</h3>
        <p className="text-sm text-muted-foreground">
          Add a new TXT record with the following settings:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
          <li><strong>Host/Name:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">_dmarc</code></li>
          <li><strong>Type:</strong> TXT</li>
          <li><strong>TTL:</strong> 3600 (or your provider's default)</li>
        </ul>
      </div>

      {/* Step 3 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Step 3: Set the record value</h3>
        <p className="text-sm text-muted-foreground">
          Copy the following DMARC record and paste it as the TXT record value:
        </p>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Your DMARCo Reporting URI:</p>
          <code className="block bg-muted p-2 rounded text-xs font-mono break-all">
            mailto:{reportingUri}
          </code>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Your DMARC record (copy this):</p>
          <div className="relative">
            <code className="block bg-muted p-3 pr-12 rounded text-xs font-mono break-words whitespace-pre-wrap border-2 border-muted-foreground/50">
              {generatedRecord}
            </code>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleCopy}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Collapsible Configuration */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-3 py-2 h-auto text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2 text-sm">
                <Settings2 className="h-4 w-4" />
                Customize policy settings
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              {/* Main Policy */}
              <div className="grid gap-2">
                <Label htmlFor="policy" className="text-sm">Policy (p)</Label>
                <Select value={policy} onValueChange={(v) => setPolicy(v as Policy)}>
                  <SelectTrigger id="policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reject">
                      <span className="flex items-center gap-2">
                        reject – Block failing emails
                        <Star className="h-3 w-3 text-success fill-success" />
                      </span>
                    </SelectItem>
                    <SelectItem value="quarantine">quarantine – Send to spam</SelectItem>
                    <SelectItem value="none">none – Monitor only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Defines how receivers handle emails that fail authentication.
                </p>
              </div>

              {/* Subdomain Policy */}
              <div className="grid gap-2">
                <Label htmlFor="sp" className="text-sm">Subdomain Policy (sp)</Label>
                <Select value={subdomainPolicy} onValueChange={(v) => setSubdomainPolicy(v as Policy)}>
                  <SelectTrigger id="sp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reject">
                      <span className="flex items-center gap-2">
                        reject – Block failing emails
                        <Star className="h-3 w-3 text-success fill-success" />
                      </span>
                    </SelectItem>
                    <SelectItem value="quarantine">quarantine – Send to spam</SelectItem>
                    <SelectItem value="none">none – Monitor only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Applies to all subdomains (e.g., mail.example.com).
                </p>
              </div>

              {/* DKIM Alignment */}
              <div className="grid gap-2">
                <Label htmlFor="adkim" className="text-sm">DKIM Alignment (adkim)</Label>
                <Select value={dkimAlignment} onValueChange={(v) => setDkimAlignment(v as Alignment)}>
                  <SelectTrigger id="adkim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s">
                      <span className="flex items-center gap-2">
                        strict – Exact domain match required
                        <Star className="h-3 w-3 text-success fill-success" />
                      </span>
                    </SelectItem>
                    <SelectItem value="r">relaxed – Subdomains allowed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How strictly DKIM domain must match the From header.
                </p>
              </div>

              {/* SPF Alignment */}
              <div className="grid gap-2">
                <Label htmlFor="aspf" className="text-sm">SPF Alignment (aspf)</Label>
                <Select value={spfAlignment} onValueChange={(v) => setSpfAlignment(v as Alignment)}>
                  <SelectTrigger id="aspf">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s">
                      <span className="flex items-center gap-2">
                        strict – Exact domain match required
                        <Star className="h-3 w-3 text-success fill-success" />
                      </span>
                    </SelectItem>
                    <SelectItem value="r">relaxed – Subdomains allowed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How strictly SPF domain must match the From header.
                </p>
              </div>

              {/* Percentage */}
              <div className="grid gap-2">
                <Label htmlFor="pct" className="text-sm">Policy Coverage (pct)</Label>
                <Select value={pct} onValueChange={(v) => setPct(v as Pct)}>
                  <SelectTrigger id="pct">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">
                      <span className="flex items-center gap-2">
                        100% – Apply to all emails
                        <Star className="h-3 w-3 text-success fill-success" />
                      </span>
                    </SelectItem>
                    <SelectItem value="50">50% – Gradual rollout</SelectItem>
                    <SelectItem value="25">25% – Testing phase</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Percentage of emails the policy applies to. Use lower values during initial testing.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> The default record uses balanced settings suitable for most users.
            Once you've verified your email sources are properly authenticated, consider upgrading to <code className="bg-muted px-1 rounded">p=reject</code> and <code className="bg-muted px-1 rounded">strict</code> alignment for maximum protection.
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Step 4: Save and wait</h3>
        <p className="text-sm text-muted-foreground">
          Save the DNS record. It may take up to 48 hours for the changes to propagate. Once email providers start sending DMARC reports, your domain will automatically appear in DMARCo.
        </p>
      </div>

    </div>
  );

  const triggerButton = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add a domain
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add a domain to DMARCo</DrawerTitle>
            <DrawerDescription>
              Follow the instructions below to configure DMARC for your domain
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a domain to DMARCo</DialogTitle>
          <DialogDescription>
            Follow the instructions below to configure DMARC for your domain
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

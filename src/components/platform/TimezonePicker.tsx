import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isSupportedTimezone, listTimezones, timezoneAbbreviation } from '@/lib/timezone';
import { cn } from '@/lib/utils';

interface TimezonePickerProps {
  id?: string;
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

/**
 * A searchable list of the time zones the browser knows.
 */
export function TimezonePicker({ id, value, onChange, disabled }: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => {
    const known = listTimezones();
    // A zone set elsewhere stays selectable even when this browser lacks it.
    const all = known.includes(value) ? known : [value, ...known];
    const now = new Date();
    return all.map((zone) => ({
      zone,
      label: zone.replace(/_/g, ' '),
      abbreviation: isSupportedTimezone(zone) ? timezoneAbbreviation(now, zone) : '',
    }));
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal sm:w-80"
        >
          <span className="truncate">{value.replace(/_/g, ' ')}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search time zones…" />
          <CommandList>
            <CommandEmpty>No time zone found.</CommandEmpty>
            <CommandGroup>
              {zones.map(({ zone, label, abbreviation }) => (
                <CommandItem
                  key={zone}
                  value={zone}
                  keywords={[label, abbreviation]}
                  onSelect={() => {
                    onChange(zone);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 shrink-0', zone === value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{label}</span>
                  <span className="ml-auto pl-2 text-xs text-muted-foreground">{abbreviation}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

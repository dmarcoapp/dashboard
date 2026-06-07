import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { format, startOfDay, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { 
  Filter, 
  X, 
  CalendarIcon, 
  Plus,
  ChevronDown,
  Search
} from 'lucide-react';
import { FilterOperator, FilterValue, useUrlFilters } from '@/hooks/use-url-filters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

type DatePreset = 'yesterday' | 'week' | 'month' | 'year' | null;

interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'number' | 'percentage' | 'date' | 'boolean';
  operators: { value: FilterOperator; label: string }[];
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    field: 'domain',
    label: 'Domain',
    type: 'text',
    operators: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Not contains' },
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not equals' },
    ],
  },
  {
    field: 'reportingOrganization',
    label: 'Reporting Organization',
    type: 'text',
    operators: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Not contains' },
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not equals' },
    ],
  },
  {
    field: 'isVerified',
    label: 'Verified',
    type: 'boolean',
    operators: [
      { value: 'eq', label: 'Is' },
    ],
  },
  {
    field: 'dmarcCompliance',
    label: 'DMARC Compliance',
    type: 'percentage',
    operators: [
      { value: 'gte', label: '≥' },
      { value: 'lte', label: '≤' },
      { value: 'gt', label: '>' },
      { value: 'lt', label: '<' },
      { value: 'eq', label: '=' },
    ],
  },
  {
    field: 'spfCompliance',
    label: 'SPF Compliance',
    type: 'percentage',
    operators: [
      { value: 'gte', label: '≥' },
      { value: 'lte', label: '≤' },
      { value: 'gt', label: '>' },
      { value: 'lt', label: '<' },
      { value: 'eq', label: '=' },
    ],
  },
  {
    field: 'dkimCompliance',
    label: 'DKIM Compliance',
    type: 'percentage',
    operators: [
      { value: 'gte', label: '≥' },
      { value: 'lte', label: '≤' },
      { value: 'gt', label: '>' },
      { value: 'lt', label: '<' },
      { value: 'eq', label: '=' },
    ],
  },
  {
    field: 'sumCount',
    label: 'Messages',
    type: 'number',
    operators: [
      { value: 'gte', label: '≥' },
      { value: 'lte', label: '≤' },
      { value: 'gt', label: '>' },
      { value: 'lt', label: '<' },
      { value: 'eq', label: '=' },
    ],
  },
  {
    field: 'records.sourceIp',
    label: 'Record Source IP',
    type: 'text',
    operators: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Not contains' },
      { value: 'eq', label: 'Equals' },
      { value: 'neq', label: 'Not equals' },
    ],
  },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
];

interface ReportsFilterPanelProps {
  urlFilters: ReturnType<typeof useUrlFilters>;
  showQuickSearch?: boolean;
  actions?: React.ReactNode;
}

function DebouncedDomainSearch({ value, onSearch }: { value: string; onSearch: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 300);
  };
  
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Quick search..."
        value={localValue}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
}

export function ReportsFilterPanel({ urlFilters, showQuickSearch = true, actions }: ReportsFilterPanelProps) {
  const { filters, setFilter, removeFilter, clearFilters, hasActiveFilters, getFilterValue } = urlFilters;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [addFilterField, setAddFilterField] = useState<string | null>(null);
  const [pendingOperator, setPendingOperator] = useState<FilterOperator>('contains');
  const [pendingValue, setPendingValue] = useState('');
  const [activePreset, setActivePreset] = useState<DatePreset>(null);

  // Get current date filter values
  const startDateValue = getFilterValue('beginDate', 'gte');
  const endDateValue = getFilterValue('endDate', 'lte');
  const startDate = startDateValue ? new Date(startDateValue) : undefined;
  const endDate = endDateValue ? new Date(endDateValue) : undefined;

  const applyDatePreset = (preset: DatePreset) => {
    const now = new Date();
    const end = startOfDay(now);
    let start: Date;
    
    switch (preset) {
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        break;
      default:
        return;
    }
    
    setActivePreset(preset);
    // Set both filters at once to avoid batching issues
    setFilter([
      { field: 'beginDate', operator: 'gte', value: format(start, 'yyyy-MM-dd') },
      { field: 'endDate', operator: 'lte', value: format(end, 'yyyy-MM-dd') }
    ]);
    setIsExpanded(false);
  };

  const handleDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    setActivePreset(null);
    if (type === 'start') {
      if (date) {
        setFilter({ field: 'beginDate', operator: 'gte', value: format(date, 'yyyy-MM-dd') });
      } else {
        removeFilter('beginDate', 'gte');
      }
    } else {
      if (date) {
        setFilter({ field: 'endDate', operator: 'lte', value: format(date, 'yyyy-MM-dd') });
      } else {
        removeFilter('endDate', 'lte');
      }
    }
  };

  const clearDateFilters = () => {
    removeFilter([
      { field: 'beginDate', operator: 'gte' },
      { field: 'endDate', operator: 'lte' }
    ]);
    setActivePreset(null);
  };

  const handleClearAll = () => {
    clearFilters();
    setActivePreset(null);
  };

  const handleAddFilter = () => {
    if (!addFilterField || !pendingValue) return;
    
    const config = FILTER_CONFIGS.find(c => c.field === addFilterField);
    if (!config) return;
    
    let value = pendingValue;
    if (config.type === 'percentage') {
      // Convert percentage input (0-100) to decimal (0-1)
      value = (parseFloat(pendingValue) / 100).toString();
    }
    
    setFilter({ field: addFilterField, operator: pendingOperator, value });
    setIsExpanded(false);
    setAddFilterField(null);
    setPendingValue('');
    setPendingOperator('contains');
  };

  const getOperatorLabel = (operator: FilterOperator): string => {
    const labels: Record<FilterOperator, string> = {
      eq: '=',
      neq: '≠',
      contains: 'contains',
      not_contains: 'not contains',
      in: 'in',
      not_in: 'not in',
      lt: '<',
      lte: '≤',
      gt: '>',
      gte: '≥',
    };
    return labels[operator];
  };

  const formatFilterValue = (filter: FilterValue): string => {
    const config = FILTER_CONFIGS.find(c => c.field === filter.field);
    if (config?.type === 'percentage') {
      return `${Math.round(parseFloat(filter.value) * 100)}%`;
    }
    if (config?.type === 'boolean') {
      return filter.value === '1' ? 'Yes' : 'No';
    }
    return filter.value;
  };

  const getFilterLabel = (field: string): string => {
    if (field === 'beginDate') return 'Start Date';
    if (field === 'endDate') return 'End Date';
    return FILTER_CONFIGS.find(c => c.field === field)?.label || field;
  };

  // Date filters for badge display
  const dateFilters = filters.filter(f => f.field === 'beginDate' || f.field === 'endDate');
  const hasDateFilter = dateFilters.length > 0;

  useEffect(() => {
    if (!hasDateFilter && activePreset !== null) {
      setActivePreset(null);
    }
  }, [hasDateFilter, activePreset]);

  // Non-date filters for display in badges
  const nonDateFilters = filters.filter(f => f.field !== 'beginDate' && f.field !== 'endDate');

  const currentAddConfig = FILTER_CONFIGS.find(c => c.field === addFilterField);

  return (
    <div className="space-y-4">
      {/* Quick Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isExpanded ? "default" : "outline"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {filters.length}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground">
              Clear all
            </Button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {actions}
          {showQuickSearch && (
            <DebouncedDomainSearch 
              value={getFilterValue('domain', 'contains') || ''} 
              onSearch={(value) => {
                if (value) {
                  setFilter({ field: 'domain', operator: 'contains', value });
                } else {
                  removeFilter('domain', 'contains');
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Active Filters Badges */}
      {(nonDateFilters.length > 0 || hasDateFilter) && (
        <div className="flex flex-wrap gap-2">
          {/* Date range badge */}
          {hasDateFilter && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="font-medium">Date Range</span>
              <span className="text-muted-foreground">
                {startDate ? format(startDate, "MMM d, yyyy") : '...'}
                {' → '}
                {endDate ? format(endDate, "MMM d, yyyy") : '...'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={clearDateFilters}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {/* Other filter badges */}
          {nonDateFilters.map((filter, idx) => (
            <Badge key={`${filter.field}-${filter.operator}-${idx}`} variant="secondary" className="gap-1 pr-1">
              <span className="font-medium">{getFilterLabel(filter.field)}</span>
              <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
              <span>{formatFilterValue(filter)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => removeFilter(filter.field, filter.operator)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded Filter Panel */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
            {/* Date Range Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="flex flex-wrap items-center gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.key}
                    variant={activePreset === preset.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyDatePreset(preset.key)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => handleDateChange(date, 'start')}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => handleDateChange(date, 'end')}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {(startDate || endDate) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Add Custom Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add Filter</Label>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Field</Label>
                  <Select value={addFilterField || ''} onValueChange={(v) => {
                    setAddFilterField(v);
                    const config = FILTER_CONFIGS.find(c => c.field === v);
                    if (config) {
                      setPendingOperator(config.operators[0].value);
                    }
                  }}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_CONFIGS.map((config) => (
                        <SelectItem key={config.field} value={config.field}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentAddConfig && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Operator</Label>
                      <Select value={pendingOperator} onValueChange={(v) => setPendingOperator(v as FilterOperator)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currentAddConfig.operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      {currentAddConfig.type === 'boolean' ? (
                        <Select value={pendingValue} onValueChange={setPendingValue}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Yes</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : currentAddConfig.type === 'percentage' ? (
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[parseInt(pendingValue) || 0]}
                            onValueChange={([v]) => setPendingValue(v.toString())}
                            max={100}
                            min={0}
                            step={5}
                            className="w-[100px]"
                          />
                          <span className="text-sm w-12 text-right">{pendingValue || 0}%</span>
                        </div>
                      ) : (
                        <Input
                          type={currentAddConfig.type === 'number' ? 'number' : 'text'}
                          value={pendingValue}
                          onChange={(e) => setPendingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && pendingValue) {
                              handleAddFilter();
                            }
                          }}
                          placeholder={`Enter ${currentAddConfig.label.toLowerCase()}`}
                          className="w-[160px]"
                        />
                      )}
                    </div>

                    <Button onClick={handleAddFilter} size="sm" disabled={!pendingValue}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Compliance Filters */}
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter({ field: 'dmarcCompliance', operator: 'lt', value: '0.9' });
                    setIsExpanded(false);
                  }}
                >
                  DMARC &lt; 90%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter({ field: 'spfCompliance', operator: 'lt', value: '0.9' });
                    setIsExpanded(false);
                  }}
                >
                  SPF &lt; 90%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter({ field: 'dkimCompliance', operator: 'lt', value: '0.9' });
                    setIsExpanded(false);
                  }}
                >
                  DKIM &lt; 90%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter({ field: 'sumCount', operator: 'gte', value: '100' });
                    setIsExpanded(false);
                  }}
                >
                  High Volume (≥100)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter({ field: 'isVerified', operator: 'eq', value: '1' });
                    setIsExpanded(false);
                  }}
                >
                  Verified Only
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

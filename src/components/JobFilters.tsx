
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

export interface JobFilters {
  search: string;
  location: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
}

export function JobFiltersComponent({ filters, onFiltersChange, onClearFilters }: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof JobFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value.trim()).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Job Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by title, company, or keywords..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {showAdvanced && (
          <>
            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="City, State"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            {/* Job Type */}
            <div>
              <Label htmlFor="jobType">Job Type</Label>
              <Select 
                value={filters.jobType} 
                onValueChange={(value) => updateFilter('jobType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salaryMin">Min Salary</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  placeholder="e.g. 50000"
                  value={filters.salaryMin}
                  onChange={(e) => updateFilter('salaryMin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="salaryMax">Max Salary</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  placeholder="e.g. 100000"
                  value={filters.salaryMax}
                  onChange={(e) => updateFilter('salaryMax', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
